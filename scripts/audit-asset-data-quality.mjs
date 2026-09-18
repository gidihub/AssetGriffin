#!/usr/bin/env node
/**
 * Audits asset records for spec-dump names, placeholder field-label values, and invalid select/status values.
 * Usage: npx tsx --env-file=.env.local scripts/audit-asset-data-quality.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { isSpecDumpName } from '../lib/asset-spec-normalization.ts'
import { findInvalidSelectStatusValues } from '../lib/field-value-validation.ts'
import { fetchAllPages } from './lib/paginate-supabase.mjs'

function isExtendedSpecDumpName(value) {
  return isSpecDumpName(String(value ?? '').trim())
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const COMMON_FIELD_LABELS = [
  'Serial',
  'Serial number',
  'Category',
  'Status',
  'Name',
  'Asset tag',
  'Asset Tag',
  'Assigned to',
  'Assigned To',
  'Location',
  'Purchase date',
  'Purchase Date',
  'Warranty expiration',
  'Depreciation value',
  'Notes',
  'Lifecycle stage',
  'Lifecycle Stage',
  'Brand',
  'Device type',
  'Operating System',
  'Processor',
  'RAM',
  'Storage',
  'Color',
]

const { data: groups, error: groupsError } = await supabase
  .from('groups')
  .select('id, slug, organization_id')
  .eq('slug', 'assets')
if (groupsError) throw new Error(groupsError.message)
if (!groups?.length) {
  console.log('No assets groups found.')
  process.exit(0)
}

let totalRecords = 0
const specDumpRecords = []
const placeholderRecords = []
const invalidSelect = []
const specKeys = ['brand', 'device_type', 'operating_system', 'processor', 'ram', 'storage', 'color']
let specDumpWithoutStructuredFields = 0
let emptySerialCount = 0
let missingSerialCount = 0

for (const group of groups) {
  const fieldList = await fetchAllPages((from, to) =>
    supabase.from('fields').select('*').eq('group_id', group.id).range(from, to),
  )

  const labelSet = new Set([
    ...COMMON_FIELD_LABELS.map((label) => label.toLowerCase()),
    ...fieldList.map((field) => String(field.label ?? '').trim().toLowerCase()).filter(Boolean),
    ...fieldList.map((field) => String(field.key ?? '').trim().toLowerCase()).filter(Boolean),
  ])

  const records = await fetchAllPages((from, to) =>
    supabase.from('records').select('id, data, organization_id').eq('group_id', group.id).range(from, to),
  )

  totalRecords += records.length

  invalidSelect.push(
    ...findInvalidSelectStatusValues(
      records.map((record) => ({ id: record.id, data: record.data ?? {} })),
      fieldList,
    ),
  )

  for (const record of records) {
    const data = record.data ?? {}
    const name = String(data.name ?? '').trim()
    if (isExtendedSpecDumpName(name)) {
      specDumpRecords.push({
        id: record.id,
        assetTag: String(data.asset_tag ?? ''),
        name: name.slice(0, 120) + (name.length > 120 ? '…' : ''),
      })
    }

    const serial = data.serial
    if (serial === null || serial === undefined) missingSerialCount += 1
    else if (String(serial).trim() === '') emptySerialCount += 1

    if (isExtendedSpecDumpName(name)) {
      const hasStructured = specKeys.some((key) => String(data[key] ?? '').trim())
      if (!hasStructured) specDumpWithoutStructuredFields += 1
    }

    for (const field of fieldList) {
      const raw = data[field.key]
      if (raw === null || raw === undefined || raw === '') continue
      const value = String(raw).trim()
      if (!value) continue

      const valueLower = value.toLowerCase()
      const labelLower = String(field.label ?? '').trim().toLowerCase()
      const keyLower = String(field.key ?? '').trim().toLowerCase()

      const matchesOtherFieldLabel = fieldList.some((other) => {
        if (other.key === field.key) return false
        const otherLabel = String(other.label ?? '').trim().toLowerCase()
        const otherKey = String(other.key ?? '').trim().toLowerCase()
        return valueLower === otherLabel || valueLower === otherKey
      })

      const isCrossFieldPlaceholder =
        labelSet.has(valueLower) &&
        valueLower !== labelLower &&
        valueLower !== keyLower &&
        matchesOtherFieldLabel

      const isLiteralSerialPlaceholder = valueLower === 'serial' && field.key === 'serial'

      if (isCrossFieldPlaceholder || isLiteralSerialPlaceholder) {
        placeholderRecords.push({
          id: record.id,
          assetTag: String(data.asset_tag ?? ''),
          fieldKey: field.key,
          fieldLabel: field.label,
          value,
          kind: isLiteralSerialPlaceholder ? 'literal-serial' : 'cross-field-label',
        })
      }
    }
  }
}

const specDumpIds = new Set(specDumpRecords.map((record) => record.id))
const placeholderIds = new Set(placeholderRecords.map((record) => record.id))
const overlapIds = [...specDumpIds].filter((id) => placeholderIds.has(id))

const placeholderByField = placeholderRecords.reduce((acc, row) => {
  acc[row.fieldKey] = (acc[row.fieldKey] ?? 0) + 1
  return acc
}, {})

console.log('=== ASSET RECORD DATA QUALITY AUDIT ===\n')
console.log(`Total asset records scanned: ${totalRecords}`)
console.log(`Assets groups / orgs: ${groups.length}\n`)

console.log('SPEC-DUMP NAMES')
console.log(`  Records: ${specDumpRecords.length}`)
for (const row of specDumpRecords.slice(0, 15)) {
  console.log(`  - ${row.assetTag || row.id}: "${row.name}"`)
}
if (specDumpRecords.length > 15) console.log(`  … and ${specDumpRecords.length - 15} more\n`)

console.log('\nPLACEHOLDER FIELD-LABEL VALUES')
console.log(`  Field instances: ${placeholderRecords.length}`)
console.log(`  Distinct records: ${placeholderIds.size}`)
console.log(`  By field: ${JSON.stringify(placeholderByField)}`)
for (const row of placeholderRecords.slice(0, 25)) {
  console.log(
    `  - ${row.assetTag || row.id} · ${row.fieldLabel} (${row.fieldKey}) = "${row.value}" [${row.kind}]`,
  )
}
if (placeholderRecords.length > 25) console.log(`  … and ${placeholderRecords.length - 25} more instances\n`)

console.log('\nINVALID SELECT/STATUS VALUES')
console.log(`  Count: ${invalidSelect.length}`)
for (const row of invalidSelect.slice(0, 10)) {
  console.log(`  - ${row.recordId} · ${row.fieldKey} = "${row.value}"`)
}

console.log('\nOVERLAP (spec-dump name + placeholder on same record)')
console.log(`  Records: ${overlapIds.length}`)
for (const id of overlapIds.slice(0, 10)) {
  const spec = specDumpRecords.find((row) => row.id === id)
  const placeholders = placeholderRecords.filter((row) => row.id === id)
  console.log(
    `  - ${spec?.assetTag || id}: "${spec?.name ?? ''}" + ${placeholders.map((p) => `${p.fieldKey}="${p.value}"`).join(', ')}`,
  )
}

console.log('\nSPEC-DUMP RECORDS WITHOUT STRUCTURED SPEC FIELDS')
console.log(`  Records: ${specDumpWithoutStructuredFields} of ${specDumpRecords.length} spec-dump names`)

console.log('\nSERIAL FIELD COVERAGE')
console.log(`  Missing serial key/null: ${missingSerialCount}`)
console.log(`  Empty string serial: ${emptySerialCount}`)
