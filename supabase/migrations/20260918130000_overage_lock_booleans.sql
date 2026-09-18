-- Tokenized GriffinEye overage billing lease (works across separate RPC sessions).

drop function if exists public.release_griffineye_overage_billing_lock(uuid);
drop function if exists public.acquire_griffineye_overage_billing_lock(uuid);

create table if not exists public.griffineye_overage_billing_leases (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  lease_token uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists griffineye_overage_billing_leases_expires_idx
  on public.griffineye_overage_billing_leases (expires_at);

alter table public.griffineye_overage_billing_leases enable row level security;

create or replace function public.acquire_griffineye_overage_billing_lock(p_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid := gen_random_uuid();
  v_now timestamptz := clock_timestamp();
  v_ttl interval := interval '5 minutes';
begin
  insert into public.griffineye_overage_billing_leases as leases (
    organization_id,
    lease_token,
    expires_at
  )
  values (p_org_id, v_token, v_now + v_ttl)
  on conflict (organization_id) do update
    set
      lease_token = excluded.lease_token,
      expires_at = excluded.expires_at,
      created_at = v_now
    where leases.expires_at <= v_now
  returning lease_token into v_token;

  return v_token;
end;
$$;

create or replace function public.release_griffineye_overage_billing_lock(
  p_org_id uuid,
  p_lease_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if p_lease_token is null then
    return false;
  end if;

  delete from public.griffineye_overage_billing_leases
  where organization_id = p_org_id
    and lease_token = p_lease_token;

  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$$;

revoke all on function public.acquire_griffineye_overage_billing_lock(uuid) from public;
revoke all on function public.release_griffineye_overage_billing_lock(uuid, uuid) from public;
grant execute on function public.acquire_griffineye_overage_billing_lock(uuid) to service_role;
grant execute on function public.release_griffineye_overage_billing_lock(uuid, uuid) to service_role;
