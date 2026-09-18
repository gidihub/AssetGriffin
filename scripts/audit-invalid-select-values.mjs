#!/usr/bin/env node
/**
 * Lists asset records where select/status field values fall outside configured choices.
 * Usage: node --env-file=.env.local scripts/audit-invalid-select-values.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { fetchAllPages } from './lib/paginate-supabase.mjs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

function fieldChoices(field) {
  const choices = field.options?.choices
  return Array.isArray(choices) ? choices.filter((entry) => typeof entry === 'string') : []
}

const { data: groups, error: groupsError } = await supabase.from('groups').select('id, slug, organization_id').eq('slug', 'assets')
if (groupsError) throw new Error(groupsError.message)

const invalidRows = []

for (const group of groups ?? []) {
  const fields = await fetchAllPages((from, to) =>
    supabase.from('fields').select('*').eq('group_id', group.id).range(from, to),
  )

  const constrained = fields.filter((field) => field.type === 'select' || field.type === 'status')
  const records = await fetchAllPages((from, to) =>
    supabase.from('records').select('id, data, organization_id').eq('group_id', group.id).range(from, to),
  )

  for (const record of records) {
    const data = record.data ?? {}
    for (const field of constrained) {
      const raw = data[field.key]
      if (raw === null || raw === undefined || raw === '') continue
      const value = String(raw).trim()
      const choices = fieldChoices(field)
      if (!choices.includes(value)) {
        invalidRows.push({
          recordId: record.id,
          orgId: record.organization_id,
          assetTag: data.asset_tag ?? '',
          name: data.name ?? '',
          fieldKey: field.key,
          fieldLabel: field.label,
          invalidValue: value,
          allowedChoices: choices,
        })
      }
    }
  }
}

console.log(JSON.stringify({ invalidCount: invalidRows.length, invalidRows }, null, 2))
process.exitCode = invalidRows.length > 0 ? 1 : 0
