-- Private bucket for per-asset photo attachments (org-scoped paths).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'asset-photos',
  'asset-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "asset_photos_select_org" on storage.objects;
create policy "asset_photos_select_org"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'asset-photos'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
);

drop policy if exists "asset_photos_insert_org" on storage.objects;
create policy "asset_photos_insert_org"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'asset-photos'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
);

drop policy if exists "asset_photos_delete_org" on storage.objects;
create policy "asset_photos_delete_org"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'asset-photos'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
);
