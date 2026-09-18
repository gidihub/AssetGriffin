-- Correct asset records whose category is not a valid choice when device_type maps reliably.
-- Safe to run after 20260916160000; idempotent once categories are valid or unmappable.

with invalid_category_records as (
  select
    r.id as record_id,
    f.options->'choices' as category_choices,
    case
      when lower(coalesce(r.data->>'device_type', '')) like '%tablet%' then 'Tablets'
      when lower(coalesce(r.data->>'device_type', '')) like '%monitor%' then 'Displays'
      when lower(coalesce(r.data->>'device_type', '')) like '%laptop%'
        or lower(coalesce(r.data->>'device_type', '')) like '%desktop%' then 'Computers'
      else null
    end as target_category
  from public.records r
  join public.groups g on r.group_id = g.id and g.slug = 'assets'
  join public.fields f on f.group_id = g.id and f.key = 'category'
  where coalesce(r.data->>'category', '') <> ''
    and not (
      r.data->>'category' = any (
        select jsonb_array_elements_text(coalesce(f.options->'choices', '[]'::jsonb))
      )
    )
),
validated_targets as (
  select icr.record_id, icr.target_category
  from invalid_category_records icr
  where icr.target_category is not null
    and icr.target_category = any (
      select jsonb_array_elements_text(coalesce(icr.category_choices, '[]'::jsonb))
    )
)
update public.records r
set data = jsonb_set(r.data, '{category}', to_jsonb(vt.target_category), true)
from validated_targets vt
where r.id = vt.record_id;
