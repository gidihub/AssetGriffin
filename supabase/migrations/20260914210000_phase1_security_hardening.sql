-- Hardening for databases that already applied 20260914180000 before these fixes landed.
-- Safe to re-run: uses DROP POLICY IF EXISTS and REVOKE IF GRANTED patterns.

revoke execute on function public.seed_assets_group_fields(uuid) from authenticated;
revoke execute on function public.seed_default_assets_group(uuid) from authenticated;

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
