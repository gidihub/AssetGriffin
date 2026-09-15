-- Claim consumption transaction before refunding credits on usage release.

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
