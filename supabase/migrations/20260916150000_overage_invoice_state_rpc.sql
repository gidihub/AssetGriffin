-- Atomic GriffinEye overage invoice state merge (row lock) + org-branding raster-only MIME types.

create or replace function public.merge_griffineye_overage_invoice_state(
  p_org_id uuid,
  p_billing_period text,
  p_invoice_item_id text,
  p_synced_scan_count integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings jsonb;
  v_period_state jsonb;
begin
  select settings
  into v_settings
  from public.organizations
  where id = p_org_id
  for update;

  if not found then
    raise exception 'Organization not found';
  end if;

  v_period_state := jsonb_build_object(
    'invoiceItemId', p_invoice_item_id,
    'syncedScanCount', p_synced_scan_count
  );

  update public.organizations
  set settings = jsonb_set(
    coalesce(v_settings, '{}'::jsonb),
    '{griffineyeOverageInvoices}',
    jsonb_set(
      coalesce(v_settings->'griffineyeOverageInvoices', '{}'::jsonb),
      array[p_billing_period],
      v_period_state,
      true
    ),
    true
  )
  where id = p_org_id;
end;
$$;

revoke all on function public.merge_griffineye_overage_invoice_state(uuid, text, text, integer) from public;
grant execute on function public.merge_griffineye_overage_invoice_state(uuid, text, text, integer) to service_role;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'org-branding';
