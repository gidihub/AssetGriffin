-- Workspace hardening: atomic action/field RPCs, grouped counts, org asset dictionary,
-- reservation locking, role-guard marker, release-window signal, UTC spend bucket.

-- ---------------------------------------------------------------------------
-- Group record counts (avoids loading all records in app code)
-- ---------------------------------------------------------------------------

create or replace function public.get_group_record_counts()
returns table (group_id uuid, record_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, count(r.id)
  from public.groups g
  left join public.records r on r.group_id = g.id
  where g.organization_id = public.current_user_organization_id()
  group by g.id;
$$;

revoke all on function public.get_group_record_counts() from public;
grant execute on function public.get_group_record_counts() to authenticated;

-- ---------------------------------------------------------------------------
-- Org asset dictionary (distinct values without fetching every row)
-- ---------------------------------------------------------------------------

create or replace function public.get_org_asset_dictionary(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_assets_group_id uuid;
  v_total bigint;
  v_categories text[];
  v_locations text[];
  v_statuses text[];
  v_owners text[];
begin
  if p_organization_id is distinct from public.current_user_organization_id() then
    raise exception 'Unauthorized organization';
  end if;

  select g.id
  into v_assets_group_id
  from public.groups g
  where g.organization_id = p_organization_id
    and g.slug = 'assets';

  if v_assets_group_id is null then
    return jsonb_build_object(
      'total_assets', 0,
      'categories', '[]'::jsonb,
      'locations', '[]'::jsonb,
      'statuses', '[]'::jsonb,
      'owners', '[]'::jsonb
    );
  end if;

  select count(*)
  into v_total
  from public.records r
  where r.group_id = v_assets_group_id
    and r.organization_id = p_organization_id;

  select coalesce(array_agg(distinct val order by val), array[]::text[])
  into v_categories
  from (
    select nullif(trim(r.data->>'category'), '') as val
    from public.records r
    where r.group_id = v_assets_group_id
      and r.organization_id = p_organization_id
  ) t
  where val is not null;

  select coalesce(array_agg(distinct val order by val), array[]::text[])
  into v_locations
  from (
    select nullif(trim(r.data->>'location'), '') as val
    from public.records r
    where r.group_id = v_assets_group_id
      and r.organization_id = p_organization_id
  ) t
  where val is not null;

  select coalesce(array_agg(distinct val order by val), array[]::text[])
  into v_statuses
  from (
    select nullif(trim(r.data->>'status'), '') as val
    from public.records r
    where r.group_id = v_assets_group_id
      and r.organization_id = p_organization_id
  ) t
  where val is not null;

  select coalesce(array_agg(distinct val order by val), array[]::text[])
  into v_owners
  from (
    select nullif(trim(r.data->>'assigned_to'), '') as val
    from public.records r
    where r.group_id = v_assets_group_id
      and r.organization_id = p_organization_id
  ) t
  where val is not null;

  return jsonb_build_object(
    'total_assets', v_total,
    'categories', to_jsonb(v_categories),
    'locations', to_jsonb(v_locations),
    'statuses', to_jsonb(v_statuses),
    'owners', to_jsonb(v_owners)
  );
end;
$$;

revoke all on function public.get_org_asset_dictionary(uuid) from public;
grant execute on function public.get_org_asset_dictionary(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic record action (row lock + update + event insert)
-- ---------------------------------------------------------------------------

create or replace function public.perform_record_action_atomic(
  p_group_id uuid,
  p_record_id uuid,
  p_action_type_id uuid,
  p_next_data jsonb,
  p_event_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_record public.records;
  v_action_type public.action_types;
  v_event_id uuid;
  v_performed_at timestamptz;
begin
  v_org_id := public.current_user_organization_id();
  if v_org_id is null then
    raise exception 'Unauthorized organization';
  end if;

  select *
  into v_action_type
  from public.action_types
  where id = p_action_type_id
    and group_id = p_group_id
    and organization_id = v_org_id;

  if not found then
    raise exception 'Action type not found';
  end if;

  select *
  into v_record
  from public.records
  where id = p_record_id
    and group_id = p_group_id
    and organization_id = v_org_id
  for update;

  if not found then
    raise exception 'Record not found';
  end if;

  update public.records
  set data = p_next_data,
      updated_at = now()
  where id = p_record_id
  returning * into v_record;

  insert into public.action_events (
    organization_id,
    record_id,
    action_type_id,
    performed_by,
    data
  )
  values (
    v_org_id,
    p_record_id,
    p_action_type_id,
    auth.uid(),
    coalesce(p_event_data, '{}'::jsonb)
  )
  returning id, performed_at into v_event_id, v_performed_at;

  return jsonb_build_object(
    'record', to_jsonb(v_record),
    'event', jsonb_build_object(
      'id', v_event_id,
      'performed_at', v_performed_at
    )
  );
end;
$$;

revoke all on function public.perform_record_action_atomic(uuid, uuid, uuid, jsonb, jsonb) from public;
grant execute on function public.perform_record_action_atomic(uuid, uuid, uuid, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic field replacement for a group
-- ---------------------------------------------------------------------------

create or replace function public.replace_group_fields_atomic(
  p_group_id uuid,
  p_fields jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_field jsonb;
  v_incoming_ids uuid[] := array[]::uuid[];
begin
  v_org_id := public.current_user_organization_id();
  if v_org_id is null then
    raise exception 'Unauthorized organization';
  end if;

  if not exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and g.organization_id = v_org_id
  ) then
    raise exception 'Group not found';
  end if;

  select coalesce(array_agg((f->>'id')::uuid), array[]::uuid[])
  into v_incoming_ids
  from jsonb_array_elements(coalesce(p_fields, '[]'::jsonb)) f
  where nullif(f->>'id', '') is not null;

  delete from public.fields
  where group_id = p_group_id
    and (
      cardinality(v_incoming_ids) = 0
      or id <> all(v_incoming_ids)
    );

  for v_field in select * from jsonb_array_elements(coalesce(p_fields, '[]'::jsonb))
  loop
    if nullif(v_field->>'id', '') is not null then
      update public.fields
      set
        key = v_field->>'key',
        label = v_field->>'label',
        type = v_field->>'type',
        options = coalesce(v_field->'options', '{}'::jsonb),
        sort_order = (v_field->>'sort_order')::int,
        required = coalesce((v_field->>'required')::boolean, false)
      where id = (v_field->>'id')::uuid
        and group_id = p_group_id;

      if not found then
        raise exception 'Field "%" was not found in this group.', v_field->>'key';
      end if;
    else
      insert into public.fields (group_id, key, label, type, options, sort_order, required)
      values (
        p_group_id,
        v_field->>'key',
        v_field->>'label',
        v_field->>'type',
        coalesce(v_field->'options', '{}'::jsonb),
        (v_field->>'sort_order')::int,
        coalesce((v_field->>'required')::boolean, false)
      );
    end if;
  end loop;
end;
$$;

revoke all on function public.replace_group_fields_atomic(uuid, jsonb) from public;
grant execute on function public.replace_group_fields_atomic(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Serialize vision reservations per organization
-- ---------------------------------------------------------------------------

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
  where o.id = p_organization_id
  for update;

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

-- ---------------------------------------------------------------------------
-- Profile role guard: allow trusted RPC to change role
-- ---------------------------------------------------------------------------

create or replace function public.profiles_guard_protected_columns()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile id cannot be changed';
  end if;
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id cannot be changed';
  end if;
  if new.email is distinct from old.email then
    raise exception 'email cannot be changed';
  end if;
  if new.role is distinct from old.role then
    if current_setting('app.allow_profile_role_change', true) is distinct from 'true' then
      raise exception 'role cannot be changed via direct update';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.update_org_member_role(p_member_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_org uuid;
  target public.profiles;
  owner_count int;
begin
  if p_role not in ('owner', 'admin', 'member') then
    raise exception 'invalid role';
  end if;

  if not public.current_user_is_org_admin() then
    raise exception 'forbidden';
  end if;

  select organization_id into actor_org from public.profiles where id = auth.uid();
  select * into target from public.profiles where id = p_member_id and organization_id = actor_org;
  if target.id is null then
    raise exception 'member not found';
  end if;

  if target.role = 'owner' and p_role <> 'owner' then
    select count(*) into owner_count from public.profiles where organization_id = actor_org and role = 'owner';
    if owner_count <= 1 then
      raise exception 'cannot remove the last owner';
    end if;
  end if;

  perform set_config('app.allow_profile_role_change', 'true', true);
  update public.profiles set role = p_role where id = p_member_id returning * into target;
  perform set_config('app.allow_profile_role_change', '', true);
  return target;
end;
$$;

-- ---------------------------------------------------------------------------
-- Release window: return false + notice when reservation expired
-- ---------------------------------------------------------------------------

-- Return type changed void → boolean; CREATE OR REPLACE cannot alter that.
drop function if exists public.release_griffin_vision_usage(uuid);

create or replace function public.release_griffin_vision_usage(p_usage_log_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_billing_source text;
  v_created_at timestamptz;
  v_release_window interval := interval '30 minutes';
begin
  select l.organization_id, l.billing_source, l.created_at
  into v_org_id, v_billing_source, v_created_at
  from public.ai_usage_log l
  where l.id = p_usage_log_id;

  if not found then
    return false;
  end if;

  if v_org_id is distinct from public.current_user_organization_id() then
    raise exception 'Unauthorized organization';
  end if;

  if v_created_at < now() - v_release_window then
    raise notice 'RELEASE_WINDOW_EXPIRED: usage log % is outside the release window', p_usage_log_id;
    return false;
  end if;

  if v_billing_source = 'purchased_credit' then
    delete from public.ai_credit_transactions t
    where t.ai_usage_log_id = p_usage_log_id
      and t.transaction_type = 'consumption';

    if not found then
      return false;
    end if;

    perform public.apply_griffin_vision_credit_delta(v_org_id, 1);
  elsif v_billing_source <> 'tier_allowance' then
    return false;
  end if;

  delete from public.ai_usage_log l where l.id = p_usage_log_id;
  return true;
end;
$$;

revoke all on function public.release_griffin_vision_usage(uuid) from public;
grant execute on function public.release_griffin_vision_usage(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- UTC spend bucket for daily spend breaker
-- ---------------------------------------------------------------------------

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
  v_day_start timestamptz;
  v_day_end timestamptz;
begin
  if p_organization_id is null then
    return jsonb_build_object(
      'allowed', false,
      'actions_today', 0,
      'estimated_spend_usd', 0,
      'reason', 'Organization required.'
    );
  end if;

  v_day_start := (v_spend_date::timestamp at time zone 'UTC');
  v_day_end := ((v_spend_date + 1)::timestamp at time zone 'UTC');

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
    and l.created_at >= v_day_start
    and l.created_at < v_day_end;

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
