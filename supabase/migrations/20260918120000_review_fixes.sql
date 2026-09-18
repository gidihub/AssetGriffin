-- Review fixes: field replacement by id, org branding admin policies, seed_group_fields auth,
-- overage billing advisory locks, device-type category backfill fallback.

-- ---------------------------------------------------------------------------
-- replace_group_fields_atomic: delete by incoming field IDs (not keys)
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

-- ---------------------------------------------------------------------------
-- Org branding storage: admin-only mutations
-- ---------------------------------------------------------------------------

drop policy if exists "org_branding_insert_org" on storage.objects;
create policy "org_branding_insert_org"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'org-branding'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
  and public.current_user_is_org_admin()
);

drop policy if exists "org_branding_update_org" on storage.objects;
create policy "org_branding_update_org"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'org-branding'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
  and public.current_user_is_org_admin()
);

drop policy if exists "org_branding_delete_org" on storage.objects;
create policy "org_branding_delete_org"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'org-branding'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
  and public.current_user_is_org_admin()
);

-- ---------------------------------------------------------------------------
-- seed_group_fields: org auth + assets branch
-- ---------------------------------------------------------------------------

create or replace function public.seed_group_fields(p_group_id uuid, p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.groups
  where id = p_group_id;

  if v_org_id is null then
    raise exception 'Group not found';
  end if;

  if auth.uid() is not null and v_org_id is distinct from public.current_user_organization_id() then
    raise exception 'forbidden';
  end if;

  if p_slug = 'assets' then
    perform public.seed_assets_group_fields(p_group_id);
  elsif p_slug = 'people' then
    insert into public.fields (group_id, key, label, type, options, sort_order, required) values
      (p_group_id, 'name', 'Name', 'text', '{}', 0, true),
      (p_group_id, 'team', 'Team', 'text', '{}', 1, false),
      (p_group_id, 'role', 'Role', 'text', '{}', 2, false),
      (p_group_id, 'department', 'Department', 'text', '{}', 3, false),
      (p_group_id, 'email', 'Email', 'text', '{}', 4, false),
      (p_group_id, 'phone', 'Phone', 'text', '{}', 5, false),
      (p_group_id, 'status', 'Status', 'status', '{"choices":["Active","Invited","Overdue"]}', 6, true),
      (p_group_id, 'last_check_out', 'Last check-out', 'date', '{}', 7, false),
      (p_group_id, 'employee_id', 'Employee ID', 'text', '{}', 8, false),
      (p_group_id, 'title', 'Title', 'text', '{}', 9, false),
      (p_group_id, 'site', 'Site', 'text', '{}', 10, false),
      (p_group_id, 'location', 'Location', 'text', '{}', 11, false),
      (p_group_id, 'notes', 'Notes', 'text', '{}', 12, false)
    on conflict (group_id, key) do nothing;
  elsif p_slug = 'locations' then
    insert into public.fields (group_id, key, label, type, options, sort_order, required) values
      (p_group_id, 'name', 'Name', 'text', '{}', 0, true),
      (p_group_id, 'type', 'Type', 'select', '{"choices":["Office","Warehouse","Job site"]}', 1, true),
      (p_group_id, 'manager', 'Manager', 'text', '{}', 2, false),
      (p_group_id, 'last_audit', 'Last audit', 'date', '{}', 3, false),
      (p_group_id, 'address', 'Address', 'text', '{}', 4, false)
    on conflict (group_id, key) do nothing;
  elsif p_slug = 'maintenance' then
    insert into public.fields (group_id, key, label, type, options, sort_order, required) values
      (p_group_id, 'asset', 'Asset', 'text', '{}', 0, true),
      (p_group_id, 'issue_type', 'Issue type', 'text', '{}', 1, false),
      (p_group_id, 'priority', 'Priority', 'status', '{"choices":["Low","Medium","High","Critical"]}', 2, true),
      (p_group_id, 'technician', 'Technician', 'text', '{}', 3, false),
      (p_group_id, 'due_date', 'Due date', 'date', '{}', 4, false),
      (p_group_id, 'status', 'Status', 'status', '{"choices":["Open","Scheduled","Overdue","Resolved"]}', 5, true),
      (p_group_id, 'description', 'Description', 'text', '{}', 6, false),
      (p_group_id, 'parts_used', 'Parts used', 'text', '{}', 7, false),
      (p_group_id, 'cost', 'Cost', 'text', '{}', 8, false),
      (p_group_id, 'resolution_notes', 'Resolution notes', 'text', '{}', 9, false)
    on conflict (group_id, key) do nothing;
  elsif p_slug = 'audits' then
    insert into public.fields (group_id, key, label, type, options, sort_order, required) values
      (p_group_id, 'name', 'Name', 'text', '{}', 0, true),
      (p_group_id, 'scope', 'Scope', 'text', '{}', 1, false),
      (p_group_id, 'auditor', 'Auditor', 'text', '{}', 2, false),
      (p_group_id, 'start_date', 'Start date', 'date', '{}', 3, false),
      (p_group_id, 'status', 'Status', 'status', '{"choices":["In progress","Complete","Needs attention","Planned"]}', 4, true),
      (p_group_id, 'scanned', 'Scanned', 'number', '{}', 5, false),
      (p_group_id, 'expected', 'Expected', 'number', '{}', 6, false),
      (p_group_id, 'notes', 'Notes', 'text', '{}', 7, false)
    on conflict (group_id, key) do nothing;
  elsif p_slug = 'inspections' then
    insert into public.fields (group_id, key, label, type, options, sort_order, required) values
      (p_group_id, 'asset_id', 'Asset ID', 'text', '{}', 0, false),
      (p_group_id, 'asset', 'Asset', 'text', '{}', 1, true),
      (p_group_id, 'checklist_template_id', 'Checklist', 'text', '{}', 2, false),
      (p_group_id, 'assigned_inspector', 'Inspector', 'text', '{}', 3, false),
      (p_group_id, 'due_date', 'Due date', 'date', '{}', 4, false),
      (p_group_id, 'status', 'Status', 'status', '{"choices":["Passed","Failed","Overdue","Scheduled"]}', 5, true),
      (p_group_id, 'last_completed', 'Last completed', 'date', '{}', 6, false),
      (p_group_id, 'inspector_notes', 'Inspector notes', 'text', '{}', 7, false),
      (p_group_id, 'results', 'Checklist results', 'json', '{"description":"Pass/fail checklist items"}', 8, false)
    on conflict (group_id, key) do nothing;
  elsif p_slug = 'reports' then
    insert into public.fields (group_id, key, label, type, options, sort_order, required) values
      (p_group_id, 'name', 'Name', 'text', '{}', 0, true),
      (p_group_id, 'type', 'Type', 'text', '{}', 1, false),
      (p_group_id, 'last_run', 'Last run', 'text', '{}', 2, false),
      (p_group_id, 'frequency', 'Frequency', 'text', '{}', 3, false),
      (p_group_id, 'owner', 'Owner', 'text', '{}', 4, false),
      (p_group_id, 'summary', 'Summary', 'text', '{}', 5, false)
    on conflict (group_id, key) do nothing;
  end if;
end;
$$;

revoke all on function public.seed_group_fields(uuid, text) from public;
grant execute on function public.seed_group_fields(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Serialize GriffinEye overage invoice work per organization (see 20260918130000)
-- ---------------------------------------------------------------------------
