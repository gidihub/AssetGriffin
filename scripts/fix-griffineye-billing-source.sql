-- Run once in Supabase → SQL Editor to permanently fix GriffinEye usage reservation.
-- Safe to re-run (CREATE OR REPLACE).

create or replace function public.reserve_griffineye_usage(
  p_organization_id uuid,
  p_usage_type text
)
returns table (usage_log_id uuid, billing_source text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_cap integer;
  v_tier_used integer;
  v_credits integer;
  v_billing_source text;
  v_log_id uuid;
  v_new_balance integer;
  v_month_start timestamptz;
begin
  if p_organization_id is distinct from public.current_user_organization_id() then
    raise exception 'Unauthorized organization';
  end if;

  if p_usage_type not in ('griffin_vision_photo', 'griffineye_query', 'griffineye_text_extract') then
    raise exception 'Invalid usage type';
  end if;

  v_month_start := date_trunc('month', (now() at time zone 'utc')) at time zone 'utc';

  select o.subscription_tier, o.griffin_vision_credits_balance
  into v_tier, v_credits
  from public.organizations o
  where o.id = p_organization_id;

  if not found then
    raise exception 'Organization not found';
  end if;

  v_cap := case v_tier
    when 'growth' then 100
    when 'scale' then 1000
    when 'enterprise' then 10000
    else 10
  end;

  select count(*)::integer
  into v_tier_used
  from public.ai_usage_log l
  where l.organization_id = p_organization_id
    and l.billing_source = 'tier_allowance'
    and l.created_at >= v_month_start;

  if v_tier_used < v_cap then
    v_billing_source := 'tier_allowance';
  elsif v_credits > 0 then
    v_billing_source := 'purchased_credit';
  else
    raise exception 'VISION_CAP_EXCEEDED';
  end if;

  if v_billing_source = 'purchased_credit' then
    update public.organizations o
    set griffin_vision_credits_balance = o.griffin_vision_credits_balance - 1
    where o.id = p_organization_id
      and o.griffin_vision_credits_balance > 0
    returning o.griffin_vision_credits_balance into v_new_balance;

    if not found then
      raise exception 'Insufficient credits';
    end if;
  end if;

  insert into public.ai_usage_log (organization_id, usage_type, billing_source)
  values (p_organization_id, p_usage_type, v_billing_source)
  returning id into v_log_id;

  if v_billing_source = 'purchased_credit' then
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

  return query select v_log_id, v_billing_source;
end;
$$;

revoke all on function public.reserve_griffineye_usage(uuid, text) from public;
grant execute on function public.reserve_griffineye_usage(uuid, text) to authenticated;
