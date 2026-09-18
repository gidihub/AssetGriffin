-- Atomically append an imported asset photo to a record's data.asset_photos array.

create or replace function public.append_record_asset_photo(
  p_record_id uuid,
  p_photo jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_data jsonb;
  v_photos jsonb;
begin
  select organization_id, data
  into v_org_id, v_data
  from public.records
  where id = p_record_id
  for update;

  if not found then
    raise exception 'Record not found';
  end if;

  if v_org_id is distinct from public.current_user_organization_id() then
    raise exception 'Unauthorized organization';
  end if;

  v_photos := coalesce(v_data->'asset_photos', '[]'::jsonb);
  if jsonb_typeof(v_photos) <> 'array' then
    v_photos := '[]'::jsonb;
  end if;

  if coalesce((p_photo->>'primary')::boolean, false) then
    select coalesce(
      jsonb_agg(
        case
          when coalesce(elem->>'primary', 'false') = 'true'
            then jsonb_set(elem, '{primary}', 'false'::jsonb)
          else elem
        end
      ),
      '[]'::jsonb
    )
    into v_photos
    from jsonb_array_elements(v_photos) as elem;
  end if;

  update public.records
  set data = jsonb_set(
    coalesce(data, '{}'::jsonb),
    '{asset_photos}',
    v_photos || jsonb_build_array(p_photo),
    true
  )
  where id = p_record_id;
end;
$$;

revoke all on function public.append_record_asset_photo(uuid, jsonb) from public;
grant execute on function public.append_record_asset_photo(uuid, jsonb) to authenticated;
