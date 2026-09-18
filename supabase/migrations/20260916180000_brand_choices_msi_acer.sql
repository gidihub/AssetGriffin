-- Append MSI and Acer to Brand select choices on all Assets groups (preserve existing choices).
update public.fields f
set options = jsonb_set(
  coalesce(f.options, '{}'::jsonb),
  '{choices}',
  (
    select coalesce(jsonb_agg(to_jsonb(elem) order by elem), '[]'::jsonb)
    from (
      select distinct elem
      from (
        select jsonb_array_elements_text(coalesce(f.options->'choices', '[]'::jsonb)) as elem
        union all
        select unnest(array['MSI', 'Acer']::text[])
      ) combined
    ) distinct_elems
  ),
  true
)
from public.groups g
where f.group_id = g.id
  and g.slug = 'assets'
  and f.key = 'brand';
