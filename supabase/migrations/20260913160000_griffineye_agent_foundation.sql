-- Foundation for the GriffinEye function-calling assistant:
--   1. numeric asset value so rankings/rollups can sum money
--   2. one shared AI allowance across every GriffinEye action (not just photos)
--   3. a categorized audit log (record / user / import / ai) for change history
--   4. real schema introspection for structural questions

-- ---------------------------------------------------------------------------
-- 1. Numeric asset value
-- ---------------------------------------------------------------------------
-- depreciation_value is a display string like '$1,840'. Rankings need real
-- numbers, so keep the display column and add a numeric companion.
alter table public.assets
add column if not exists purchase_value numeric(14, 2);

update public.assets
set purchase_value = nullif(regexp_replace(depreciation_value, '[^0-9.]', '', 'g'), '')::numeric
where purchase_value is null
  and depreciation_value is not null
  and regexp_replace(depreciation_value, '[^0-9.]', '', 'g') <> '';

create index if not exists assets_org_purchase_value_idx
  on public.assets (organization_id, purchase_value desc nulls last);

create index if not exists assets_org_updated_at_idx
  on public.assets (organization_id, updated_at desc);

grant select, insert, update, delete on public.assets to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Shared AI allowance across all GriffinEye actions
-- ---------------------------------------------------------------------------
-- Photo extraction, natural-language queries, and text-to-record extraction all
-- call OpenAI, so they all bill against the same monthly tier allowance.
alter table public.ai_usage_log
drop constraint if exists ai_usage_log_usage_type_check;

alter table public.ai_usage_log
add constraint ai_usage_log_usage_type_check check (
  usage_type in ('griffin_vision_photo', 'griffineye_query', 'griffineye_text_extract')
);

drop policy if exists "ai_usage_log_insert_org" on public.ai_usage_log;
create policy "ai_usage_log_insert_org"
on public.ai_usage_log
for insert
to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and usage_type in ('griffin_vision_photo', 'griffineye_query', 'griffineye_text_extract')
);

create index if not exists ai_usage_log_org_billing_created_idx
  on public.ai_usage_log (organization_id, billing_source, created_at desc);

-- Generalized reservation: same atomic cap/credit logic, any usage type.
-- The monthly cap is shared, so tier usage counts every usage_type.
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

  select subscription_tier, griffin_vision_credits_balance
  into v_tier, v_credits
  from public.organizations
  where id = p_organization_id;

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
  from public.ai_usage_log
  where organization_id = p_organization_id
    and billing_source = 'tier_allowance'
    and created_at >= v_month_start;

  if v_tier_used < v_cap then
    v_billing_source := 'tier_allowance';
  elsif v_credits > 0 then
    v_billing_source := 'purchased_credit';
  else
    raise exception 'VISION_CAP_EXCEEDED';
  end if;

  if v_billing_source = 'purchased_credit' then
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

-- Keep the original photo-only entry point working by delegating.
create or replace function public.reserve_griffin_vision_usage(p_organization_id uuid)
returns table (usage_log_id uuid, billing_source text)
language sql
security definer
set search_path = public
as $$
  select * from public.reserve_griffineye_usage(p_organization_id, 'griffin_vision_photo');
$$;

revoke all on function public.reserve_griffin_vision_usage(uuid) from public;
grant execute on function public.reserve_griffin_vision_usage(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Categorized audit log
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- Sub-log the event belongs to, mirroring the activity-log split in the UI.
  category text not null check (category in ('record', 'user', 'import', 'ai')),
  action text not null,
  -- How the change was made, so "changed via import" vs "changed manually" is answerable.
  source text not null default 'manual'
    check (source in ('manual', 'import', 'griffineye', 'system', 'api')),
  actor_id uuid references auth.users (id) on delete set null,
  actor_label text not null default 'System',
  entity_type text not null default '',
  entity_id uuid,
  entity_label text not null default '',
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_org_created_idx
  on public.audit_log (organization_id, created_at desc);
create index if not exists audit_log_org_category_created_idx
  on public.audit_log (organization_id, category, created_at desc);
create index if not exists audit_log_org_source_created_idx
  on public.audit_log (organization_id, source, created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select_org" on public.audit_log;
create policy "audit_log_select_org"
on public.audit_log
for select
to authenticated
using (organization_id = public.current_user_organization_id());

-- Insert-only for members: the log is append-only, with no update/delete policy.
drop policy if exists "audit_log_insert_org" on public.audit_log;
create policy "audit_log_insert_org"
on public.audit_log
for insert
to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and (actor_id is null or actor_id = auth.uid())
);

grant select, insert on public.audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Schema introspection
-- ---------------------------------------------------------------------------
-- Backs get_schema_info(). Returns column metadata only — never row data — and
-- is limited to the tables GriffinEye is allowed to reason about.
create or replace function public.griffineye_schema_info()
returns table (
  table_name text,
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES'),
    c.column_default::text
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name in ('assets', 'audit_log', 'ai_usage_log', 'ai_credit_transactions', 'organizations', 'profiles')
  order by c.table_name, c.ordinal_position
$$;

revoke all on function public.griffineye_schema_info() from public;
grant execute on function public.griffineye_schema_info() to authenticated;
