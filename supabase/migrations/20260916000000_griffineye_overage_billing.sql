-- GriffinEye scan allowances + overage billing (replaces purchased credit packs for new usage).

alter table public.ai_usage_log
  drop constraint if exists ai_usage_log_billing_source_check;

alter table public.ai_usage_log
  add constraint ai_usage_log_billing_source_check
  check (billing_source in ('tier_allowance', 'purchased_credit', 'overage'));

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
  v_allowance integer;
  v_abuse_ceiling integer;
  v_tier_used integer;
  v_total_used integer;
  v_billing_source text;
  v_log_id uuid;
  v_month_start timestamptz;
begin
  if p_organization_id is distinct from public.current_user_organization_id() then
    raise exception 'Unauthorized organization';
  end if;

  if p_usage_type not in ('griffin_vision_photo', 'griffineye_query', 'griffineye_text_extract') then
    raise exception 'Invalid usage type';
  end if;

  v_month_start := date_trunc('month', (now() at time zone 'utc')) at time zone 'utc';

  select o.subscription_tier
  into v_tier
  from public.organizations o
  where o.id = p_organization_id
  for update;

  if not found then
    raise exception 'Organization not found';
  end if;

  v_allowance := case v_tier
    when 'growth' then 500
    when 'scale' then 2500
    when 'enterprise' then 10000
    else 50
  end;

  v_abuse_ceiling := case v_tier
    when 'growth' then 2500
    when 'scale' then 12500
    when 'enterprise' then 50000
    else 50
  end;

  select count(*)::integer
  into v_tier_used
  from public.ai_usage_log l
  where l.organization_id = p_organization_id
    and l.billing_source = 'tier_allowance'
    and l.created_at >= v_month_start;

  select count(*)::integer
  into v_total_used
  from public.ai_usage_log l
  where l.organization_id = p_organization_id
    and l.created_at >= v_month_start;

  if v_total_used >= v_abuse_ceiling and v_abuse_ceiling > v_allowance then
    raise exception 'ABUSE_CAP_EXCEEDED';
  end if;

  if v_tier = 'free' then
    if v_tier_used >= v_allowance then
      raise exception 'VISION_CAP_EXCEEDED';
    end if;
    v_billing_source := 'tier_allowance';
  elsif v_tier_used < v_allowance then
    v_billing_source := 'tier_allowance';
  else
    v_billing_source := 'overage';
  end if;

  insert into public.ai_usage_log (organization_id, usage_type, billing_source)
  values (p_organization_id, p_usage_type, v_billing_source)
  returning id into v_log_id;

  return query select v_log_id, v_billing_source;
end;
$$;

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
  elsif v_billing_source not in ('tier_allowance', 'overage') then
    return false;
  end if;

  delete from public.ai_usage_log l where l.id = p_usage_log_id;
  return true;
end;
$$;
