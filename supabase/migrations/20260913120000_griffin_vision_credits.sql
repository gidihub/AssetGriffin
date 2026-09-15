-- GriffinEye purchased scan credits (top-up on tier monthly allowance).

alter table public.organizations
add column if not exists griffin_vision_credits_balance integer not null default 0
  check (griffin_vision_credits_balance >= 0);

alter table public.organizations
add column if not exists stripe_customer_id text;

alter table public.ai_usage_log
add column if not exists billing_source text not null default 'tier_allowance'
  check (billing_source in ('tier_allowance', 'purchased_credit'));

create table if not exists public.ai_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  transaction_type text not null check (transaction_type in ('purchase', 'consumption')),
  credits_delta integer not null check (credits_delta <> 0),
  credits_balance_after integer not null check (credits_balance_after >= 0),
  pack_key text check (pack_key in ('starter', 'standard', 'bulk')),
  amount_cents integer check (amount_cents is null or amount_cents > 0),
  currency text not null default 'usd',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  ai_usage_log_id uuid references public.ai_usage_log (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ai_credit_transactions_purchase_requires_pack check (
    transaction_type <> 'purchase' or pack_key is not null
  ),
  constraint ai_credit_transactions_purchase_requires_session check (
    transaction_type <> 'purchase' or stripe_checkout_session_id is not null
  )
);

create unique index if not exists ai_credit_transactions_stripe_session_uidx
  on public.ai_credit_transactions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists ai_credit_transactions_org_created_idx
  on public.ai_credit_transactions (organization_id, created_at desc);

alter table public.ai_credit_transactions enable row level security;

drop policy if exists "ai_credit_transactions_select_org" on public.ai_credit_transactions;
create policy "ai_credit_transactions_select_org"
on public.ai_credit_transactions
for select
to authenticated
using (organization_id = public.current_user_organization_id());

grant select on public.ai_credit_transactions to authenticated;

-- Atomically grant credits after Stripe webhook confirms payment (service role only).
create or replace function public.grant_griffin_vision_credits(
  p_organization_id uuid,
  p_credits integer,
  p_pack_key text,
  p_amount_cents integer,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance integer;
  v_existing_balance integer;
begin
  if p_credits <= 0 then
    raise exception 'Credits must be positive';
  end if;

  select credits_balance_after
  into v_existing_balance
  from public.ai_credit_transactions
  where stripe_checkout_session_id = p_stripe_checkout_session_id;

  if found then
    return v_existing_balance;
  end if;

  update public.organizations
  set griffin_vision_credits_balance = griffin_vision_credits_balance + p_credits
  where id = p_organization_id
  returning griffin_vision_credits_balance into v_new_balance;

  if not found then
    raise exception 'Organization not found';
  end if;

  insert into public.ai_credit_transactions (
    organization_id,
    transaction_type,
    credits_delta,
    credits_balance_after,
    pack_key,
    amount_cents,
    stripe_checkout_session_id,
    stripe_payment_intent_id
  )
  values (
    p_organization_id,
    'purchase',
    p_credits,
    v_new_balance,
    p_pack_key,
    p_amount_cents,
    p_stripe_checkout_session_id,
    p_stripe_payment_intent_id
  );

  return v_new_balance;
end;
$$;

revoke all on function public.grant_griffin_vision_credits(uuid, integer, text, integer, text, text) from public;
grant execute on function public.grant_griffin_vision_credits(uuid, integer, text, integer, text, text) to service_role;

-- Atomically record a vision call against tier allowance or purchased credits.
create or replace function public.record_griffin_vision_usage(
  p_organization_id uuid,
  p_billing_source text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
  v_new_balance integer;
begin
  if p_organization_id is distinct from public.current_user_organization_id() then
    raise exception 'Unauthorized organization';
  end if;

  if p_billing_source not in ('tier_allowance', 'purchased_credit') then
    raise exception 'Invalid billing source';
  end if;

  if p_billing_source = 'purchased_credit' then
    update public.organizations
    set griffin_vision_credits_balance = griffin_vision_credits_balance - 1
    where id = p_organization_id
      and griffin_vision_credits_balance > 0
    returning griffin_vision_credits_balance into v_new_balance;

    if not found then
      raise exception 'Insufficient credits';
    end if;
  end if;

  insert into public.ai_usage_log (organization_id, usage_type, billing_source)
  values (p_organization_id, 'griffin_vision_photo', p_billing_source)
  returning id into v_log_id;

  if p_billing_source = 'purchased_credit' then
    insert into public.ai_credit_transactions (
      organization_id,
      transaction_type,
      credits_delta,
      credits_balance_after,
      ai_usage_log_id
    )
    values (
      p_organization_id,
      'consumption',
      -1,
      v_new_balance,
      v_log_id
    );
  end if;

  return v_log_id;
end;
$$;

revoke all on function public.record_griffin_vision_usage(uuid, text) from public;
grant execute on function public.record_griffin_vision_usage(uuid, text) to authenticated;
