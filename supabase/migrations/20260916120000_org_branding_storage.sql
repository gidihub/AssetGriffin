-- Public bucket for organization logos (org-scoped paths, authenticated upload).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-branding',
  'org-branding',
  true,
  524288,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "org_branding_select_public" on storage.objects;
create policy "org_branding_select_public"
on storage.objects
for select
to public
using (bucket_id = 'org-branding');

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
