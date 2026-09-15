-- Atomic daily spend breaker reservations (org-scoped, UTC day bucket).

create table if not exists public.griffineye_daily_spend (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  spend_date date not null,
  reserved_actions integer not null default 0 check (reserved_actions >= 0),
  primary key (organization_id, spend_date)
);

alter table public.griffineye_daily_spend enable row level security;

create or replace function public.reserve_griffineye_daily_spend(
  p_organization_id uuid,
  p_estimated_cost_usd numeric default 0.02,
  p_daily_cap_usd numeric default 25
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spend_date date := (timezone('utc', now()))::date;
  v_log_count bigint;
  v_reserved integer;
  v_actions_today bigint;
  v_estimated numeric;
  v_next_estimated numeric;
begin
  if p_organization_id is null then
    return jsonb_build_object(
      'allowed', false,
      'actions_today', 0,
      'estimated_spend_usd', 0,
      'reason', 'Organization required.'
    );
  end if;

  insert into public.griffineye_daily_spend (organization_id, spend_date, reserved_actions)
  values (p_organization_id, v_spend_date, 0)
  on conflict (organization_id, spend_date) do nothing;

  select g.reserved_actions
  into v_reserved
  from public.griffineye_daily_spend g
  where g.organization_id = p_organization_id
    and g.spend_date = v_spend_date
  for update;

  select count(*)
  into v_log_count
  from public.ai_usage_log l
  where l.organization_id = p_organization_id
    and l.created_at >= v_spend_date::timestamptz;

  v_actions_today := greatest(v_log_count, v_reserved);
  v_estimated := v_actions_today * p_estimated_cost_usd;
  v_next_estimated := (v_actions_today + 1) * p_estimated_cost_usd;

  if v_next_estimated > p_daily_cap_usd then
    return jsonb_build_object(
      'allowed', false,
      'actions_today', v_actions_today,
      'estimated_spend_usd', v_estimated,
      'reason', format(
        'Daily GriffinEye spend limit reached for this organization ($%s estimated cap).',
        trim(to_char(p_daily_cap_usd, 'FM999999990.00'))
      )
    );
  end if;

  update public.griffineye_daily_spend
  set reserved_actions = reserved_actions + 1
  where organization_id = p_organization_id
    and spend_date = v_spend_date;

  return jsonb_build_object(
    'allowed', true,
    'actions_today', v_actions_today + 1,
    'estimated_spend_usd', v_next_estimated
  );
end;
$$;

revoke all on function public.reserve_griffineye_daily_spend(uuid, numeric, numeric) from public;
grant execute on function public.reserve_griffineye_daily_spend(uuid, numeric, numeric) to authenticated;
grant execute on function public.reserve_griffineye_daily_spend(uuid, numeric, numeric) to service_role;
