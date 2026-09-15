-- Atomic credit balance adjustments and guarded usage release.

create or replace function public.apply_griffin_vision_credit_delta(
  p_organization_id uuid,
  p_delta integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_delta = 0 then
    raise exception 'Invalid credit delta';
  end if;

  update public.organizations o
  set griffin_vision_credits_balance = o.griffin_vision_credits_balance + p_delta
  where o.id = p_organization_id
    and (p_delta > 0 or o.griffin_vision_credits_balance + p_delta >= 0)
  returning o.griffin_vision_credits_balance into v_balance;

  if not found then
    if p_delta < 0 then
      raise exception 'Insufficient credits';
    end if;
    raise exception 'Organization not found';
  end if;

  return v_balance;
end;
$$;

revoke all on function public.apply_griffin_vision_credit_delta(uuid, integer) from public;
grant execute on function public.apply_griffin_vision_credit_delta(uuid, integer) to service_role;

create or replace function public.release_griffin_vision_usage(p_usage_log_id uuid)
returns void
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
    return;
  end if;

  if v_org_id is distinct from public.current_user_organization_id() then
    raise exception 'Unauthorized organization';
  end if;

  -- Only uncommitted reservations within the server-controlled release window.
  if v_created_at < now() - v_release_window then
    return;
  end if;

  if v_billing_source = 'purchased_credit' then
    delete from public.ai_credit_transactions t
    where t.ai_usage_log_id = p_usage_log_id
      and t.transaction_type = 'consumption';

    if not found then
      return;
    end if;

    perform public.apply_griffin_vision_credit_delta(v_org_id, 1);
  elsif v_billing_source <> 'tier_allowance' then
    return;
  end if;

  delete from public.ai_usage_log l where l.id = p_usage_log_id;
end;
$$;

revoke all on function public.release_griffin_vision_usage(uuid) from public;
grant execute on function public.release_griffin_vision_usage(uuid) to authenticated;
