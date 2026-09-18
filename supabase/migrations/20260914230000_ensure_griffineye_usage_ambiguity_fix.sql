-- Idempotent re-apply of reserve_griffineye_usage / release_griffin_vision_usage fixes.
-- Safe to run if 20260913170000_fix_griffineye_usage_ambiguity.sql was skipped.

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

revoke all on function public.reserve_griffineye_usage(uuid, text) from public;
grant execute on function public.reserve_griffineye_usage(uuid, text) to authenticated;

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
    if not exists (
      select 1
      from public.ai_credit_transactions t
      where t.ai_usage_log_id = p_usage_log_id
        and t.transaction_type = 'consumption'
    ) then
      return false;
    end if;

    update public.organizations o
    set griffin_vision_credits_balance = o.griffin_vision_credits_balance + 1
    where o.id = v_org_id;

    delete from public.ai_credit_transactions t
    where t.ai_usage_log_id = p_usage_log_id
      and t.transaction_type = 'consumption';
  elsif v_billing_source <> 'tier_allowance' then
    return false;
  end if;

  delete from public.ai_usage_log l where l.id = p_usage_log_id;
  return true;
end;
$$;

revoke all on function public.release_griffin_vision_usage(uuid) from public;
grant execute on function public.release_griffin_vision_usage(uuid) to authenticated;
