-- Asset specification fields: lift it_details into typed fields, deprecate opaque JSON blob.

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
      'brand',
      'Brand',
      'select',
      '{"choices":["HP","Dell","Apple","Lenovo","Microsoft","MSI","Acer","Other"]}'::jsonb,
      14,
      false
    ),
    (
      p_group_id,
      'device_type',
      'Device type',
      'select',
      '{"choices":["Laptop","Desktop","Tablet","Monitor","Server"]}'::jsonb,
      15,
      false
    ),
    (p_group_id, 'model', 'Model', 'text', '{}'::jsonb, 16, false),
    (
      p_group_id,
      'operating_system',
      'Operating System',
      'select',
      '{"choices":["Windows 11 Pro","Windows 10","macOS","ChromeOS","Linux","Other"]}'::jsonb,
      17,
      false
    ),
    (p_group_id, 'processor', 'Processor', 'text', '{}'::jsonb, 18, false),
    (
      p_group_id,
      'ram',
      'RAM',
      'select',
      '{"choices":["4GB","8GB","16GB","32GB","64GB+"]}'::jsonb,
      19,
      false
    ),
    (p_group_id, 'storage', 'Storage', 'text', '{}'::jsonb, 20, false),
    (p_group_id, 'color', 'Color', 'text', '{}'::jsonb, 21, false),
    (
      p_group_id,
      'mdm_enrollment_status',
      'MDM enrollment status',
      'select',
      '{"choices":["Enrolled","Not enrolled"]}'::jsonb,
      22,
      false
    ),
    (
      p_group_id,
      'security_monitoring_software',
      'Security & monitoring software',
      'json',
      '{"description":"Tag list of security and monitoring agents","suggested":["CrowdStrike","SentinelOne","ActivTrak","Jamf Protect","Microsoft Defender"]}'::jsonb,
      23,
      false
    ),
    (
      p_group_id,
      'it_details',
      'IT details (deprecated)',
      'json',
      '{"description":"Deprecated — use specification fields instead","deprecated":true}'::jsonb,
      24,
      false
    )
  on conflict (group_id, key) do update
  set
    label = excluded.label,
    type = excluded.type,
    options = excluded.options,
    sort_order = excluded.sort_order;
end;
$$;

revoke all on function public.seed_assets_group_fields(uuid) from public;

-- Backfill specification fields for every existing Assets group.
insert into public.fields (group_id, key, label, type, options, sort_order, required)
select
  g.id,
  seed.key,
  seed.label,
  seed.type,
  seed.options,
  seed.sort_order,
  seed.required
from public.groups g
cross join (
  values
    ('brand', 'Brand', 'select', '{"choices":["HP","Dell","Apple","Lenovo","Microsoft","MSI","Acer","Other"]}'::jsonb, 14, false),
    ('device_type', 'Device type', 'select', '{"choices":["Laptop","Desktop","Tablet","Monitor","Server"]}'::jsonb, 15, false),
    ('model', 'Model', 'text', '{}'::jsonb, 16, false),
    ('operating_system', 'Operating System', 'select', '{"choices":["Windows 11 Pro","Windows 10","macOS","ChromeOS","Linux","Other"]}'::jsonb, 17, false),
    ('processor', 'Processor', 'text', '{}'::jsonb, 18, false),
    ('ram', 'RAM', 'select', '{"choices":["4GB","8GB","16GB","32GB","64GB+"]}'::jsonb, 19, false),
    ('storage', 'Storage', 'text', '{}'::jsonb, 20, false),
    ('color', 'Color', 'text', '{}'::jsonb, 21, false),
    ('mdm_enrollment_status', 'MDM enrollment status', 'select', '{"choices":["Enrolled","Not enrolled"]}'::jsonb, 22, false),
    (
      'security_monitoring_software',
      'Security & monitoring software',
      'json',
      '{"description":"Tag list of security and monitoring agents","suggested":["CrowdStrike","SentinelOne","ActivTrak","Jamf Protect","Microsoft Defender"]}'::jsonb,
      23,
      false
    )
) as seed(key, label, type, options, sort_order, required)
where g.slug = 'assets'
on conflict (group_id, key) do update
set
  label = excluded.label,
  type = excluded.type,
  options = excluded.options,
  sort_order = excluded.sort_order;

update public.fields f
set
  label = 'IT details (deprecated)',
  options = '{"description":"Deprecated — use specification fields instead","deprecated":true}'::jsonb,
  sort_order = 24
from public.groups g
where f.group_id = g.id
  and g.slug = 'assets'
  and f.key = 'it_details';

-- Clear brand names incorrectly stored as category (e.g. "HP" instead of "Computers").
update public.records r
set data = jsonb_set(
  r.data,
  '{category}',
  to_jsonb(
    case
      when lower(coalesce(r.data->>'device_type', '')) like '%tablet%' then 'Tablets'
      when lower(coalesce(r.data->>'device_type', '')) like '%monitor%' then 'Displays'
      when lower(coalesce(r.data->>'device_type', '')) like '%laptop%'
        or lower(coalesce(r.data->>'device_type', '')) like '%desktop%' then 'Computers'
      else 'Computers'
    end
  ),
  true
)
from public.groups g
where r.group_id = g.id
  and g.slug = 'assets'
  and r.data->>'category' in ('HP', 'Dell', 'Apple', 'Lenovo', 'Microsoft');

-- Lift legacy it_details JSON into typed specification fields (preserve it_details object).
update public.records r
set data = r.data
  || jsonb_strip_nulls(
    jsonb_build_object(
      'operating_system',
        case
          when coalesce(r.data->>'operating_system', '') <> '' then r.data->>'operating_system'
          when coalesce(r.data->'it_details'->>'os', '') <> '' then r.data->'it_details'->>'os'
          else null
        end,
      'mdm_enrollment_status',
        case
          when coalesce(r.data->>'mdm_enrollment_status', '') <> '' then r.data->>'mdm_enrollment_status'
          when coalesce(r.data->'it_details'->>'mdmStatus', '') <> '' then r.data->'it_details'->>'mdmStatus'
          else null
        end,
      'security_monitoring_software',
        case
          when r.data ? 'security_monitoring_software' then r.data->'security_monitoring_software'
          when jsonb_typeof(r.data->'it_details'->'licenses') = 'array'
            and jsonb_array_length(r.data->'it_details'->'licenses') > 0
            then jsonb_build_object('tags', r.data->'it_details'->'licenses')
          else null
        end,
      'notes',
        case
          when coalesce(r.data->>'notes', '') <> ''
            and coalesce(r.data->'it_details'->>'warrantyPlan', '') <> '' then
            trim(both from concat(
              r.data->>'notes',
              E'\n',
              'Warranty plan: ',
              r.data->'it_details'->>'warrantyPlan',
              case
                when coalesce(r.data->'it_details'->>'warrantyPlanExpiration', '') <> ''
                  then concat(' (expires ', r.data->'it_details'->>'warrantyPlanExpiration', ')')
                else ''
              end
            ))
          when coalesce(r.data->>'notes', '') <> '' then r.data->>'notes'
          when coalesce(r.data->'it_details'->>'warrantyPlan', '') <> '' then
            trim(both from concat(
              'Warranty plan: ',
              r.data->'it_details'->>'warrantyPlan',
              case
                when coalesce(r.data->'it_details'->>'warrantyPlanExpiration', '') <> ''
                  then concat(' (expires ', r.data->'it_details'->>'warrantyPlanExpiration', ')')
                else ''
              end
            ))
          else null
        end
    )
  )
from public.groups g
where r.group_id = g.id
  and g.slug = 'assets'
  and r.data ? 'it_details'
  and r.data->'it_details' is not null
  and r.data->'it_details' <> 'null'::jsonb;
