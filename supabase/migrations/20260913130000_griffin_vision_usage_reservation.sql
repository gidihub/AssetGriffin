-- Atomic vision usage reservation with tier-cap enforcement and release on failed extraction.

create or replace function public.reserve_griffin_vision_usage(p_organization_id uuid)
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

  v_month_start := date_trunc('month', (now() at time zone 'utc')) at time zone 'utc';

  select subscription_tier, griffin_vision_credits_balance
  into v_tier, v_credits
  from public.organizations
  where id = p_organization_id
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
  from public.ai_usage_log
  where organization_id = p_organization_id
    and usage_type = 'griffin_vision_photo'
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
  values (p_organization_id, 'griffin_vision_photo', v_billing_source)
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

revoke all on function public.reserve_griffin_vision_usage(uuid) from public;
grant execute on function public.reserve_griffin_vision_usage(uuid) to authenticated;

create or replace function public.release_griffin_vision_usage(p_usage_log_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_billing_source text;
begin
  select organization_id, billing_source
  into v_org_id, v_billing_source
  from public.ai_usage_log
  where id = p_usage_log_id;

  if not found then
    return;
  end if;

  if v_org_id is distinct from public.current_user_organization_id() then
    raise exception 'Unauthorized organization';
  end if;

  if v_billing_source = 'purchased_credit' then
    update public.organizations
    set griffin_vision_credits_balance = griffin_vision_credits_balance + 1
    where id = v_org_id;

    delete from public.ai_credit_transactions
    where ai_usage_log_id = p_usage_log_id
      and transaction_type = 'consumption';
  end if;

  delete from public.ai_usage_log where id = p_usage_log_id;
end;
$$;

revoke all on function public.release_griffin_vision_usage(uuid) from public;
grant execute on function public.release_griffin_vision_usage(uuid) to authenticated;
