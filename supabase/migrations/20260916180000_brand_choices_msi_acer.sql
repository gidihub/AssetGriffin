-- Append MSI and Acer to Brand select choices on all Assets groups (preserve existing choices).
update public.fields f
set options = jsonb_set(
  coalesce(f.options, '{}'::jsonb),
  '{choices}',
  (
    case
      when jsonb_typeof(coalesce(f.options->'choices', '[]'::jsonb)) = 'array'
        then coalesce(f.options->'choices', '[]'::jsonb)
      else '[]'::jsonb
    end
    || case
      when jsonb_typeof(coalesce(f.options->'choices', '[]'::jsonb)) = 'array'
        and not coalesce(f.options->'choices', '[]'::jsonb) @> '["MSI"]'::jsonb
        then '["MSI"]'::jsonb
      when jsonb_typeof(coalesce(f.options->'choices', '[]'::jsonb)) <> 'array'
        then '["MSI"]'::jsonb
      else '[]'::jsonb
    end
    || case
      when jsonb_typeof(coalesce(f.options->'choices', '[]'::jsonb)) = 'array'
        and not coalesce(f.options->'choices', '[]'::jsonb) @> '["Acer"]'::jsonb
        then '["Acer"]'::jsonb
      when jsonb_typeof(coalesce(f.options->'choices', '[]'::jsonb)) <> 'array'
        then '["Acer"]'::jsonb
      else '[]'::jsonb
    end
  ),
  true
)
from public.groups g
where f.group_id = g.id
  and g.slug = 'assets'
  and f.key = 'brand';
