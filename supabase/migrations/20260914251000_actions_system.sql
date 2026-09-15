-- Phase 3: Actions system (action_types + action_events).

create table if not exists public.action_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('standard', 'date_driven')),
  open_field text,
  change_field text,
  config jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (group_id, name)
);

create index if not exists action_types_organization_id_idx on public.action_types (organization_id);
create index if not exists action_types_group_id_idx on public.action_types (group_id);

create table if not exists public.action_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  record_id uuid not null references public.records (id) on delete cascade,
  action_type_id uuid not null references public.action_types (id) on delete restrict,
  performed_by uuid references auth.users (id) on delete set null,
  performed_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists action_events_organization_id_idx on public.action_events (organization_id);
create index if not exists action_events_record_id_idx on public.action_events (record_id);
create index if not exists action_events_action_type_id_idx on public.action_events (action_type_id);
create index if not exists action_events_performed_at_idx on public.action_events (organization_id, performed_at desc);

alter table public.action_types enable row level security;
alter table public.action_events enable row level security;

drop policy if exists "action_types_select_org" on public.action_types;
create policy "action_types_select_org"
on public.action_types
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "action_types_insert_org" on public.action_types;
create policy "action_types_insert_org"
on public.action_types
for insert
to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and exists (
    select 1
    from public.groups g
    where g.id = group_id
      and g.organization_id = public.current_user_organization_id()
  )
  and organization_id = (
    select g.organization_id
    from public.groups g
    where g.id = group_id
  )
);

drop policy if exists "action_types_update_org" on public.action_types;
create policy "action_types_update_org"
on public.action_types
for update
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and exists (
    select 1
    from public.groups g
    where g.id = group_id
      and g.organization_id = public.current_user_organization_id()
  )
)
with check (
  organization_id = public.current_user_organization_id()
  and exists (
    select 1
    from public.groups g
    where g.id = group_id
      and g.organization_id = public.current_user_organization_id()
  )
  and organization_id = (
    select g.organization_id
    from public.groups g
    where g.id = group_id
  )
);

drop policy if exists "action_types_delete_org" on public.action_types;
create policy "action_types_delete_org"
on public.action_types
for delete
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "action_events_select_org" on public.action_events;
create policy "action_events_select_org"
on public.action_events
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "action_events_insert_org" on public.action_events;
create policy "action_events_insert_org"
on public.action_events
for insert
to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and (performed_by is null or performed_by = auth.uid())
  and exists (
    select 1
    from public.records r
    where r.id = record_id
      and r.organization_id = public.current_user_organization_id()
  )
  and exists (
    select 1
    from public.action_types at
    where at.id = action_type_id
      and at.organization_id = public.current_user_organization_id()
  )
  and organization_id = (
    select r.organization_id
    from public.records r
    where r.id = record_id
  )
  and exists (
    select 1
    from public.records r
    join public.action_types at on at.id = action_type_id
    where r.id = record_id
      and r.group_id = at.group_id
      and r.organization_id = public.current_user_organization_id()
  )
);

grant select, insert, update, delete on public.action_types to authenticated;
grant select, insert on public.action_events to authenticated;

-- Seed default action types when a group is created or backfilled.
create or replace function public.seed_default_action_types(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_slug text;
begin
  select organization_id, slug into v_org_id, v_slug
  from public.groups
  where id = p_group_id;

  if v_org_id is null then
    return;
  end if;

  if auth.uid() is not null and v_org_id is distinct from public.current_user_organization_id() then
    raise exception 'forbidden';
  end if;

  if v_slug = 'assets' then
    insert into public.action_types (organization_id, group_id, name, kind, open_field, change_field, config, sort_order)
    values
      (v_org_id, p_group_id, 'Check out', 'standard', 'assigned_to', 'assigned_to', '{"prompt":"Assign to"}'::jsonb, 0),
      (v_org_id, p_group_id, 'Transfer', 'standard', 'location', 'location', '{"prompt":"Move to location"}'::jsonb, 1),
      (v_org_id, p_group_id, 'Dispose', 'standard', 'status', 'status', '{"value":"Retired"}'::jsonb, 2)
    on conflict (group_id, name) do nothing;
  elsif v_slug = 'maintenance' then
    insert into public.action_types (organization_id, group_id, name, kind, open_field, change_field, config, sort_order)
    values
      (
        v_org_id,
        p_group_id,
        'Schedule maintenance',
        'date_driven',
        'due_date',
        'status',
        '{"due_date_field":"due_date","status_on_open":"Scheduled","status_on_complete":"Resolved"}'::jsonb,
        0
      ),
      (
        v_org_id,
        p_group_id,
        'Log repair',
        'standard',
        'description',
        'status',
        '{"status_on_complete":"Resolved"}'::jsonb,
        1
      )
    on conflict (group_id, name) do nothing;
  elsif v_slug = 'inspections' then
    insert into public.action_types (organization_id, group_id, name, kind, open_field, change_field, config, sort_order)
    values
      (
        v_org_id,
        p_group_id,
        'Run inspection',
        'standard',
        'results',
        'status',
        '{
          "checklist_items": [
            {"id":"visual","label":"Visual inspection","required":true},
            {"id":"function","label":"Functional test","required":true},
            {"id":"safety","label":"Safety check","required":true},
            {"id":"notes","label":"Inspector notes","required":false}
          ],
          "pass_status":"Passed",
          "fail_status":"Failed"
        }'::jsonb,
        0
      ),
      (
        v_org_id,
        p_group_id,
        'Schedule inspection',
        'date_driven',
        'due_date',
        'status',
        '{"due_date_field":"due_date","status_on_open":"Scheduled"}'::jsonb,
        1
      )
    on conflict (group_id, name) do nothing;
  else
    insert into public.action_types (organization_id, group_id, name, kind, open_field, change_field, config, sort_order)
    values
      (v_org_id, p_group_id, 'Log update', 'standard', null, 'status', '{}'::jsonb, 0),
      (v_org_id, p_group_id, 'Transfer', 'standard', null, null, '{}'::jsonb, 1),
      (v_org_id, p_group_id, 'Archive', 'standard', null, 'status', '{"value":"Archived"}'::jsonb, 2)
    on conflict (group_id, name) do nothing;
  end if;
end;
$$;

revoke all on function public.seed_default_action_types(uuid) from public;
grant execute on function public.seed_default_action_types(uuid) to authenticated;

-- Hook action seeding into new custom groups.
create or replace function public.seed_new_group_fields(p_group_id uuid, p_slug text)
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

  if v_org_id is null or v_org_id is distinct from public.current_user_organization_id() then
    raise exception 'forbidden';
  end if;

  perform public.seed_group_fields(p_group_id, p_slug);
  insert into public.fields (group_id, key, label, type, options, sort_order, required)
  values (p_group_id, 'name', 'Name', 'text', '{}'::jsonb, 0, true)
  on conflict (group_id, key) do nothing;
  perform public.seed_default_action_types(p_group_id);
end;
$$;

-- Seed action types when default workspace groups are created for a new org.
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
    perform public.seed_default_action_types(v_group_id);
  end loop;

  select id into v_group_id
  from public.groups
  where organization_id = p_organization_id
    and slug = 'assets';

  if v_group_id is not null then
    perform public.seed_default_action_types(v_group_id);
  end if;
end;
$$;

revoke all on function public.seed_default_workspace_groups(uuid) from public;
revoke execute on function public.seed_default_workspace_groups(uuid) from authenticated;

-- Backfill action types for existing workspace groups.
do $$
declare
  grp record;
begin
  for grp in select id from public.groups loop
    perform public.seed_default_action_types(grp.id);
  end loop;
end;
$$;

-- Extend GriffinEye schema introspection to include action tables.
create or replace function public.griffineye_schema_info()
returns table (
  table_name text,
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES'),
    c.column_default::text
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name in (
      'groups',
      'fields',
      'records',
      'action_types',
      'action_events',
      'audit_log',
      'ai_usage_log',
      'ai_credit_transactions',
      'organizations',
      'profiles'
    )

  union all

  select
    (g.slug || ' (record fields)')::text as table_name,
    f.key::text as column_name,
    f.type::text as data_type,
    (not f.required) as is_nullable,
    null::text as column_default
  from public.fields f
  join public.groups g on g.id = f.group_id
  where g.organization_id = public.current_user_organization_id()

  order by 1, 2
$$;
