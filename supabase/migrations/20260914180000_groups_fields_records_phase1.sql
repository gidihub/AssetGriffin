-- Phase 1: Groups → Fields → Records core schema
-- Migrates existing assets into records; freezes the legacy assets table.
--
-- Deferred (documented future scope, not v1):
--   bidirectional/backlink fields, field-level formulas/rollups,
--   cross-group polymorphic relations, real-time sync views over assets.

-- ---------------------------------------------------------------------------
-- 1. Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  icon text not null default 'boxes',
  slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index if not exists groups_organization_id_idx on public.groups (organization_id);
create index if not exists groups_org_sort_idx on public.groups (organization_id, sort_order);

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  key text not null,
  label text not null,
  type text not null check (
    type in ('text', 'number', 'date', 'select', 'status', 'checkbox', 'relation', 'json')
  ),
  options jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (group_id, key)
);

create index if not exists fields_group_id_idx on public.fields (group_id);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists records_organization_id_idx on public.records (organization_id);
create index if not exists records_group_id_idx on public.records (group_id);
create index if not exists records_org_updated_at_idx on public.records (organization_id, updated_at desc);

-- Asset tag uniqueness within an org's Assets group (expression index).
create unique index if not exists records_assets_tag_unique_idx
  on public.records (group_id, ((data ->> 'asset_tag')))
  where (data ? 'asset_tag');

create or replace function public.set_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists records_set_updated_at on public.records;
create trigger records_set_updated_at
before update on public.records
for each row
execute function public.set_records_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Seed field definitions for the default Assets group
-- ---------------------------------------------------------------------------

create or replace function public.seed_assets_group_fields(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.fields (group_id, key, label, type, options, sort_order, required)
  values
    (p_group_id, 'asset_tag', 'Asset tag', 'text', '{}'::jsonb, 0, true),
    (p_group_id, 'name', 'Name', 'text', '{}'::jsonb, 1, true),
    (
      p_group_id,
      'category',
      'Category',
      'select',
      '{"choices":["Computers","Tablets","Mobile","Displays","Furniture","Equipment","Tools","Vehicles","Apparatus","PPE","Medical"]}'::jsonb,
      2,
      true
    ),
    (p_group_id, 'assigned_to', 'Assigned to', 'text', '{}'::jsonb, 3, false),
    (p_group_id, 'location', 'Location', 'text', '{}'::jsonb, 4, false),
    (
      p_group_id,
      'status',
      'Status',
      'status',
      '{"choices":["In use","In maintenance","Retired","Available"]}'::jsonb,
      5,
      true
    ),
    (p_group_id, 'purchase_date', 'Purchase date', 'date', '{}'::jsonb, 6, false),
    (p_group_id, 'serial', 'Serial number', 'text', '{}'::jsonb, 7, false),
    (p_group_id, 'warranty_expiration', 'Warranty expiration', 'date', '{}'::jsonb, 8, false),
    (p_group_id, 'depreciation_value', 'Depreciation value', 'text', '{}'::jsonb, 9, false),
    (p_group_id, 'purchase_value', 'Purchase value', 'number', '{}'::jsonb, 10, false),
    (p_group_id, 'notes', 'Notes', 'text', '{}'::jsonb, 11, false),
    (
      p_group_id,
      'lifecycle_stage',
      'Lifecycle stage',
      'status',
      '{"choices":["Procurement","Deployed","In Maintenance","Retired/Disposed"]}'::jsonb,
      12,
      true
    ),
    (
      p_group_id,
      'lifecycle_dates',
      'Lifecycle dates',
      'json',
      '{"description":"Structured map of lifecycle stage to ISO date strings"}'::jsonb,
      13,
      false
    ),
    (
      p_group_id,
      'it_details',
      'IT details',
      'json',
      '{"description":"Structured IT metadata (OS, MDM, licenses, warranty plan)"}'::jsonb,
      14,
      false
    )
  on conflict (group_id, key) do nothing;
end;
$$;

revoke all on function public.seed_assets_group_fields(uuid) from public;

-- Creates the default Assets group + field schema for one organization.
create or replace function public.seed_default_assets_group(p_organization_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  insert into public.groups (organization_id, name, icon, slug, sort_order)
  values (p_organization_id, 'Assets', 'boxes', 'assets', 0)
  on conflict (organization_id, slug) do update set name = excluded.name
  returning id into v_group_id;

  if v_group_id is null then
    select id into v_group_id
    from public.groups
    where organization_id = p_organization_id
      and slug = 'assets';
  end if;

  perform public.seed_assets_group_fields(v_group_id);
  return v_group_id;
end;
$$;

revoke all on function public.seed_default_assets_group(uuid) from public;

-- ---------------------------------------------------------------------------
-- 3. Migrate legacy assets → records (record.id = asset.id)
-- ---------------------------------------------------------------------------

do $$
declare
  org record;
  assets_group_id uuid;
  migrated_count int;
begin
  for org in select id from public.organizations loop
    assets_group_id := public.seed_default_assets_group(org.id);

    insert into public.records (
      id,
      group_id,
      organization_id,
      data,
      created_at,
      updated_at,
      created_by
    )
    select
      a.id,
      assets_group_id,
      a.organization_id,
      jsonb_strip_nulls(
        jsonb_build_object(
          'asset_tag', a.asset_tag,
          'name', a.name,
          'category', a.category,
          'assigned_to', a.assigned_to,
          'location', a.location,
          'status', a.status,
          'purchase_date', a.purchase_date,
          'serial', a.serial,
          'warranty_expiration', a.warranty_expiration,
          'depreciation_value', a.depreciation_value,
          'purchase_value', a.purchase_value,
          'notes', a.notes,
          'lifecycle_stage', a.lifecycle_stage,
          'lifecycle_dates', coalesce(a.lifecycle_dates, '{}'::jsonb),
          'it_details', a.it_details
        )
      ),
      a.created_at,
      a.updated_at,
      null
    from public.assets a
    where a.organization_id = org.id
    on conflict (id) do nothing;

    get diagnostics migrated_count = row_count;
    raise notice 'Org %: migrated % asset rows into records', org.id, migrated_count;
  end loop;
end;
$$;

-- Ensure every org has an Assets group even if it had zero legacy assets.
insert into public.groups (organization_id, name, icon, slug, sort_order)
select o.id, 'Assets', 'boxes', 'assets', 0
from public.organizations o
where not exists (
  select 1
  from public.groups g
  where g.organization_id = o.id
    and g.slug = 'assets'
);

do $$
declare
  grp record;
begin
  for grp in
    select id
    from public.groups
    where slug = 'assets'
  loop
    perform public.seed_assets_group_fields(grp.id);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Freeze legacy assets table (read-only; no triggers)
-- ---------------------------------------------------------------------------

drop trigger if exists assets_set_updated_at on public.assets;

revoke insert, update, delete on public.assets from authenticated;
grant select on public.assets to authenticated;

comment on table public.assets is
  'LEGACY (frozen Phase 1): read-only archive. Source of truth is public.records. '
  'Drop in a follow-up migration after verify-groups-fields-records-phase1.mjs passes.';

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.fields enable row level security;
alter table public.records enable row level security;

drop policy if exists "groups_select_org" on public.groups;
create policy "groups_select_org"
on public.groups
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "groups_insert_org" on public.groups;
create policy "groups_insert_org"
on public.groups
for insert
to authenticated
with check (organization_id = public.current_user_organization_id());

drop policy if exists "groups_update_org" on public.groups;
create policy "groups_update_org"
on public.groups
for update
to authenticated
using (organization_id = public.current_user_organization_id())
with check (organization_id = public.current_user_organization_id());

drop policy if exists "groups_delete_org" on public.groups;
create policy "groups_delete_org"
on public.groups
for delete
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "fields_select_org" on public.fields;
create policy "fields_select_org"
on public.fields
for select
to authenticated
using (
  group_id in (
    select g.id
    from public.groups g
    where g.organization_id = public.current_user_organization_id()
  )
);

drop policy if exists "fields_insert_org" on public.fields;
create policy "fields_insert_org"
on public.fields
for insert
to authenticated
with check (
  group_id in (
    select g.id
    from public.groups g
    where g.organization_id = public.current_user_organization_id()
  )
);

drop policy if exists "fields_update_org" on public.fields;
create policy "fields_update_org"
on public.fields
for update
to authenticated
using (
  group_id in (
    select g.id
    from public.groups g
    where g.organization_id = public.current_user_organization_id()
  )
)
with check (
  group_id in (
    select g.id
    from public.groups g
    where g.organization_id = public.current_user_organization_id()
  )
);

drop policy if exists "fields_delete_org" on public.fields;
create policy "fields_delete_org"
on public.fields
for delete
to authenticated
using (
  group_id in (
    select g.id
    from public.groups g
    where g.organization_id = public.current_user_organization_id()
  )
);

drop policy if exists "records_select_org" on public.records;
create policy "records_select_org"
on public.records
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "records_insert_org" on public.records;
create policy "records_insert_org"
on public.records
for insert
to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and group_id in (
    select g.id
    from public.groups g
    where g.organization_id = public.current_user_organization_id()
  )
);

drop policy if exists "records_update_org" on public.records;
create policy "records_update_org"
on public.records
for update
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and group_id in (
    select g.id
    from public.groups g
    where g.organization_id = public.current_user_organization_id()
  )
)
with check (
  organization_id = public.current_user_organization_id()
  and group_id in (
    select g.id
    from public.groups g
    where g.organization_id = public.current_user_organization_id()
  )
);

drop policy if exists "records_delete_org" on public.records;
create policy "records_delete_org"
on public.records
for delete
to authenticated
using (organization_id = public.current_user_organization_id());

-- ---------------------------------------------------------------------------
-- 6. New-org signup: seed default Assets group + fields
-- ---------------------------------------------------------------------------

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

  perform public.seed_default_assets_group(new_org_id);

  return new;
end;
$$;

grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.fields to authenticated;
grant select, insert, update, delete on public.records to authenticated;
