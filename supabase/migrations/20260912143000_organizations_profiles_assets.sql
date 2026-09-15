-- Organizations, profiles, assets, and org-scoped RLS for AssetGriffin.

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_organization_id_idx on public.profiles (organization_id);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  asset_tag text not null,
  name text not null,
  category text not null,
  assigned_to text not null default 'Unassigned',
  location text not null default '',
  status text not null default 'Available'
    check (status in ('In use', 'In maintenance', 'Retired', 'Available')),
  purchase_date date,
  serial text not null default '',
  warranty_expiration date,
  depreciation_value text not null default '$0',
  notes text not null default '',
  lifecycle_stage text not null default 'Procurement'
    check (lifecycle_stage in ('Procurement', 'Deployed', 'In Maintenance', 'Retired/Disposed')),
  lifecycle_dates jsonb not null default '{}'::jsonb,
  it_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, asset_tag)
);

create index if not exists assets_organization_id_idx on public.assets (organization_id);
create index if not exists assets_status_idx on public.assets (status);

create or replace function public.set_assets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at
before update on public.assets
for each row
execute function public.set_assets_updated_at();

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
$$;

revoke all on function public.current_user_organization_id() from public;
grant execute on function public.current_user_organization_id() to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.assets enable row level security;

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
on public.organizations
for select
to authenticated
using (id = public.current_user_organization_id());

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.profiles_guard_protected_columns()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile id cannot be changed';
  end if;
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id cannot be changed';
  end if;
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed';
  end if;
  if new.email is distinct from old.email then
    raise exception 'email cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_protected_columns on public.profiles;
create trigger profiles_guard_protected_columns
before update on public.profiles
for each row
execute function public.profiles_guard_protected_columns();

drop policy if exists "assets_select_org" on public.assets;
create policy "assets_select_org"
on public.assets
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "assets_insert_org" on public.assets;
create policy "assets_insert_org"
on public.assets
for insert
to authenticated
with check (organization_id = public.current_user_organization_id());

drop policy if exists "assets_update_org" on public.assets;
create policy "assets_update_org"
on public.assets
for update
to authenticated
using (organization_id = public.current_user_organization_id())
with check (organization_id = public.current_user_organization_id());

drop policy if exists "assets_delete_org" on public.assets;
create policy "assets_delete_org"
on public.assets
for delete
to authenticated
using (organization_id = public.current_user_organization_id());

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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

grant usage on schema public to authenticated;
grant select on public.organizations to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.assets to authenticated;
