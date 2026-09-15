-- Workspace settings wiring: branding, org config, team visibility, record admin helpers.

-- ---------------------------------------------------------------------------
-- Organization & profile extensions
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column if not exists primary_color text not null default '#2FA391',
  add column if not exists logo_url text,
  add column if not exists custom_domain text,
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists job_title text,
  add column if not exists timezone text not null default 'America/New_York';

create or replace function public.current_user_is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('owner', 'admin') from public.profiles where id = auth.uid()),
    false
  )
$$;

revoke all on function public.current_user_is_org_admin() from public;
grant execute on function public.current_user_is_org_admin() to authenticated;

-- Team: members in the same org can see each other.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_org"
on public.profiles
for select
to authenticated
using (organization_id = public.current_user_organization_id());

-- Users can update their own profile fields (not role/org/email).
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
  if new.email is distinct from old.email then
    raise exception 'email cannot be changed';
  end if;
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed via direct update';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_protected_columns on public.profiles;
create trigger profiles_guard_protected_columns
before update on public.profiles
for each row
execute function public.profiles_guard_protected_columns();

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin"
on public.organizations
for update
to authenticated
using (id = public.current_user_organization_id() and public.current_user_is_org_admin())
with check (id = public.current_user_organization_id() and public.current_user_is_org_admin());

grant update (name, primary_color, logo_url, custom_domain, settings) on public.organizations to authenticated;
grant update (full_name, job_title, timezone, preferences) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Org-scoped configuration tables
-- ---------------------------------------------------------------------------

create table if not exists public.spending_limits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category text not null,
  threshold_amount text not null default '$0',
  approval_amount text not null default '$0',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text not null default '',
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  members_label text not null default '',
  member_profile_ids uuid[] not null default '{}',
  threshold_label text not null default '',
  category text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  head_name text not null default '',
  budget_amount text not null default '$0',
  member_count int not null default 0,
  asset_count int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  trigger_label text not null default '',
  action_label text not null default '',
  enabled boolean not null default true,
  last_triggered_label text not null default 'Never',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.org_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  integration_key text not null,
  connected boolean not null default false,
  last_synced_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, integration_key)
);

create table if not exists public.org_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.org_webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  permission_key text not null,
  label text not null,
  description text not null default '',
  employee_enabled boolean not null default false,
  manager_enabled boolean not null default true,
  sort_order int not null default 0,
  unique (organization_id, permission_key)
);

create index if not exists spending_limits_org_idx on public.spending_limits (organization_id);
create index if not exists custom_roles_org_idx on public.custom_roles (organization_id);
create index if not exists approval_groups_org_idx on public.approval_groups (organization_id);
create index if not exists departments_org_idx on public.departments (organization_id);
create index if not exists workflows_org_idx on public.workflows (organization_id);
create index if not exists org_integrations_org_idx on public.org_integrations (organization_id);
create index if not exists org_api_keys_org_idx on public.org_api_keys (organization_id);
create index if not exists org_webhooks_org_idx on public.org_webhooks (organization_id);
create index if not exists feature_permissions_org_idx on public.feature_permissions (organization_id);

alter table public.spending_limits enable row level security;
alter table public.custom_roles enable row level security;
alter table public.approval_groups enable row level security;
alter table public.departments enable row level security;
alter table public.workflows enable row level security;
alter table public.org_integrations enable row level security;
alter table public.org_api_keys enable row level security;
alter table public.org_webhooks enable row level security;
alter table public.feature_permissions enable row level security;

-- Read: any org member. Write: admins only.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'spending_limits', 'custom_roles', 'approval_groups', 'departments',
    'workflows', 'org_integrations', 'org_api_keys', 'org_webhooks', 'feature_permissions'
  ] loop
    execute format('drop policy if exists "%1$s_select_org" on public.%1$s', tbl);
    execute format(
      'create policy "%1$s_select_org" on public.%1$s for select to authenticated using (organization_id = public.current_user_organization_id())',
      tbl
    );
    execute format('drop policy if exists "%1$s_write_admin" on public.%1$s', tbl);
    execute format(
      'create policy "%1$s_write_admin" on public.%1$s for all to authenticated using (organization_id = public.current_user_organization_id() and public.current_user_is_org_admin()) with check (organization_id = public.current_user_organization_id() and public.current_user_is_org_admin())',
      tbl
    );
  end loop;
end $$;

grant select on public.spending_limits to authenticated;
grant select on public.custom_roles to authenticated;
grant select on public.approval_groups to authenticated;
grant select on public.departments to authenticated;
grant select on public.workflows to authenticated;
grant select on public.org_integrations to authenticated;
revoke select on public.org_api_keys from authenticated;
grant select (id, name, key_prefix, created_at) on public.org_api_keys to authenticated;
grant select on public.org_webhooks to authenticated;
grant select on public.feature_permissions to authenticated;

grant insert, update, delete on public.spending_limits to authenticated;
grant insert, update, delete on public.custom_roles to authenticated;
grant insert, update, delete on public.approval_groups to authenticated;
grant insert, update, delete on public.departments to authenticated;
grant insert, update, delete on public.workflows to authenticated;
grant insert, update, delete on public.org_integrations to authenticated;
grant insert, update, delete on public.org_api_keys to authenticated;
grant insert, update, delete on public.org_webhooks to authenticated;
grant insert, update, delete on public.feature_permissions to authenticated;

-- Admin updates member role (owner/admin only; cannot demote last owner).
create or replace function public.update_org_member_role(p_member_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_org uuid;
  target public.profiles;
  owner_count int;
begin
  if p_role not in ('owner', 'admin', 'member') then
    raise exception 'invalid role';
  end if;

  if not public.current_user_is_org_admin() then
    raise exception 'forbidden';
  end if;

  select organization_id into actor_org from public.profiles where id = auth.uid();
  select * into target from public.profiles where id = p_member_id and organization_id = actor_org;
  if target.id is null then
    raise exception 'member not found';
  end if;

  if target.role = 'owner' and p_role <> 'owner' then
    select count(*) into owner_count from public.profiles where organization_id = actor_org and role = 'owner';
    if owner_count <= 1 then
      raise exception 'cannot remove the last owner';
    end if;
  end if;

  update public.profiles set role = p_role where id = p_member_id returning * into target;
  return target;
end;
$$;

revoke all on function public.update_org_member_role(uuid, text) from public;
grant execute on function public.update_org_member_role(uuid, text) to authenticated;

-- Seed default fields when a custom group is created.
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
end;
$$;

revoke all on function public.seed_new_group_fields(uuid, text) from public;
grant execute on function public.seed_new_group_fields(uuid, text) to authenticated;

-- Seed workspace defaults for a new org (idempotent).
create or replace function public.seed_workspace_settings(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and p_org_id is distinct from public.current_user_organization_id() then
    raise exception 'forbidden';
  end if;

  insert into public.feature_permissions (organization_id, permission_key, label, description, employee_enabled, manager_enabled, sort_order)
  values
    (p_org_id, 'view_assets', 'View assets', 'View and review workspace information', true, true, 0),
    (p_org_id, 'create_edit_assets', 'Create and edit assets', 'Create, update, and manage records', false, true, 1),
    (p_org_id, 'check_in_out', 'Check assets in and out', 'Check assets in and out', true, true, 2),
    (p_org_id, 'manage_maintenance', 'Manage maintenance', 'Create and manage maintenance work orders', false, true, 3),
    (p_org_id, 'run_audits', 'Run physical audits', 'Run and complete physical audits', false, true, 4),
    (p_org_id, 'export_reports', 'Export reports', 'Export records and reports', false, true, 5)
  on conflict (organization_id, permission_key) do nothing;

  if not exists (select 1 from public.spending_limits where organization_id = p_org_id) then
    insert into public.spending_limits (organization_id, category, threshold_amount, approval_amount, sort_order)
    values
      (p_org_id, 'Computers & tablets', '$1,500', '$2,500', 0),
      (p_org_id, 'Furniture', '$800', '$1,500', 1),
      (p_org_id, 'Vehicles', '$5,000', '$15,000', 2),
      (p_org_id, 'Tools & equipment', '$500', '$2,000', 3);
  end if;

  if not exists (select 1 from public.workflows where organization_id = p_org_id) then
    insert into public.workflows (organization_id, name, trigger_label, action_label, enabled, last_triggered_label, sort_order)
    values
      (p_org_id, 'Overdue check-in reminder', 'Check-out age > 30 days', 'Email assignee + manager', true, 'Never', 0),
      (p_org_id, 'High-value approval', 'Purchase above category threshold', 'Route to approval group', true, 'Never', 1),
      (p_org_id, 'Warranty expiration alert', 'Warranty expires in 30 days', 'Notify asset owner', false, 'Never', 2);
  end if;
end;
$$;

revoke all on function public.seed_workspace_settings(uuid) from public;
grant execute on function public.seed_workspace_settings(uuid) to authenticated;

do $$
declare
  org_row record;
begin
  for org_row in select id from public.organizations loop
    perform public.seed_workspace_settings(org_row.id);
  end loop;
end $$;
