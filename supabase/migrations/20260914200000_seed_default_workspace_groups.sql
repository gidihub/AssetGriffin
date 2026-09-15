-- Phase 2: seed default workspace groups (fields only; records added via UI/import).

create or replace function public.seed_group_fields(p_group_id uuid, p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_slug = 'people' then
    insert into public.fields (group_id, key, label, type, options, sort_order, required) values
      (p_group_id, 'name', 'Name', 'text', '{}', 0, true),
      (p_group_id, 'team', 'Team', 'text', '{}', 1, false),
      (p_group_id, 'role', 'Role', 'text', '{}', 2, false),
      (p_group_id, 'department', 'Department', 'text', '{}', 3, false),
      (p_group_id, 'email', 'Email', 'text', '{}', 4, false),
      (p_group_id, 'phone', 'Phone', 'text', '{}', 5, false),
      (p_group_id, 'status', 'Status', 'status', '{"choices":["Active","Invited","Overdue"]}', 6, true),
      (p_group_id, 'last_check_out', 'Last check-out', 'date', '{}', 7, false)
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

create or replace function public.seed_default_workspace_groups(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  def record;
  v_group_id uuid;
begin
  perform public.seed_default_assets_group(p_organization_id);

  for def in
    select *
    from (
      values
        ('People & teams', 'users', 'people', 1),
        ('Locations', 'home', 'locations', 2),
        ('Maintenance', 'wrench', 'maintenance', 3),
        ('Audits', 'clipboard-check', 'audits', 4),
        ('Inspections', 'clipboard-list', 'inspections', 5),
        ('Reports', 'activity', 'reports', 6)
    ) as t(name, icon, slug, sort_order)
  loop
    insert into public.groups (organization_id, name, icon, slug, sort_order)
    values (p_organization_id, def.name, def.icon, def.slug, def.sort_order)
    on conflict (organization_id, slug) do update set name = excluded.name
    returning id into v_group_id;

    if v_group_id is null then
      select id into v_group_id
      from public.groups
      where organization_id = p_organization_id
        and slug = def.slug;
    end if;

    perform public.seed_group_fields(v_group_id, def.slug);
  end loop;
end;
$$;

revoke all on function public.seed_default_workspace_groups(uuid) from public;
revoke execute on function public.seed_default_workspace_groups(uuid) from authenticated;
revoke all on function public.seed_group_fields(uuid, text) from public;
revoke execute on function public.seed_group_fields(uuid, text) from authenticated;

-- Backfill existing organizations.
do $$
declare
  org record;
begin
  for org in select id from public.organizations loop
    perform public.seed_default_workspace_groups(org.id);
  end loop;
end;
$$;

-- New signups get the full workspace group set.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
begin
  org_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''),
    split_part(new.email, '@', 1) || '''s workspace'
  );

  insert into public.organizations (name)
  values (org_name)
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, email, full_name, role)
  values (
    new.id,
    new_org_id,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    'owner'
  );

  perform public.seed_default_workspace_groups(new_org_id);

  return new;
end;
$$;
