-- Harden action_types / action_events RLS: verify group, record, and action_type ownership.

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

drop policy if exists "action_events_insert_org" on public.action_events;
create policy "action_events_insert_org"
on public.action_events
for insert
to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and performed_by = auth.uid()
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
