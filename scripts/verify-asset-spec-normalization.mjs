#!/usr/bin/env node
/**
 * Verifies spec-dump parsing + select-field sanitization for the HP Laptop test case.
 * Usage: npx tsx scripts/verify-asset-spec-normalization.mjs
 */
import { applySpecFieldsToRecordData, parseSpecDump } from '../lib/asset-spec-normalization.ts'
import { sanitizeRecordData } from '../lib/field-value-validation.ts'

const SAMPLE =
  'HP Laptop, AMD E2-9000E Radeon, 1.5GHZ, 8GB RAM, 512GB HDD, Windows 11 Pro, Silver colour'

const mockFields = [
  { id: '1', group_id: 'g', key: 'category', label: 'Category', type: 'select', options: { choices: ['Computers', 'Tablets', 'Mobile', 'Displays', 'Furniture', 'Equipment', 'Tools', 'Vehicles', 'Apparatus', 'PPE', 'Medical'] }, sort_order: 2, required: true, created_at: '' },
  { id: '2', group_id: 'g', key: 'brand', label: 'Brand', type: 'select', options: { choices: ['HP', 'Dell', 'Apple', 'Lenovo', 'Microsoft', 'MSI', 'Acer', 'Other'] }, sort_order: 14, required: false, created_at: '' },
  { id: '3', group_id: 'g', key: 'device_type', label: 'Device type', type: 'select', options: { choices: ['Laptop', 'Desktop', 'Tablet', 'Monitor', 'Server'] }, sort_order: 15, required: false, created_at: '' },
  { id: '4', group_id: 'g', key: 'operating_system', label: 'Operating System', type: 'select', options: { choices: ['Windows 11 Pro', 'Windows 10', 'macOS', 'ChromeOS', 'Linux', 'Other'] }, sort_order: 17, required: false, created_at: '' },
  { id: '5', group_id: 'g', key: 'ram', label: 'RAM', type: 'select', options: { choices: ['4GB', '8GB', '16GB', '32GB', '64GB+'] }, sort_order: 19, required: false, created_at: '' },
  { id: '6', group_id: 'g', key: 'status', label: 'Status', type: 'status', options: { choices: ['In use', 'In maintenance', 'Retired', 'Available'] }, sort_order: 5, required: true, created_at: '' },
]

const spec = parseSpecDump(SAMPLE)
const raw = applySpecFieldsToRecordData(
  { name: SAMPLE, category: 'HP', status: 'Available' },
  spec,
)
const { data, issues } = sanitizeRecordData(raw, mockFields)

const expected = {
  name: 'HP Laptop',
  category: 'Computers',
  brand: 'HP',
  device_type: 'Laptop',
  operating_system: 'Windows 11 Pro',
  processor: 'AMD E2-9000E Radeon, 1.5GHZ',
  ram: '8GB',
  storage: '512GB HDD',
  color: 'Silver',
}

let failed = false
for (const [key, value] of Object.entries(expected)) {
  if (String(data[key] ?? '') !== value) {
    console.error(`FAIL ${key}: expected "${value}", got "${data[key] ?? ''}"`)
    failed = true
  }
}

if (data.category === 'HP') {
  console.error('FAIL category still contains invalid brand value "HP"')
  failed = true
}

const categoryIssue = issues.find((issue) => issue.key === 'category' && issue.invalidValue === 'HP')
if (!categoryIssue) {
  console.error('FAIL expected category invalidation issue for "HP"')
  failed = true
}

if (failed) {
  console.error('\nParsed spec:', spec)
  console.error('\nSanitized data:', data)
  console.error('\nIssues:', issues)
  process.exit(1)
}

console.log('HP Laptop spec-dump test case passed.')

const auditSamples = [
  {
    tag: '20462012',
    name: 'Apple - MacBook Air 13-inch Laptop - Apple M2 chip Built for Apple Intelligence - 16GB Memory - 256GB SSD - Midnight',
    expect: { wasSpecDump: true, brand: 'Apple', device_type: 'Laptop', ram: '16GB', storage: '256GB SSD', color: 'Midnight' },
  },
  {
    tag: '13758693',
    name: 'Dell Latitude 7490, Intel Core i7, 14-inch screen, 32GB RAM, 1TB SSD, Windows 11 Pro',
    expect: { wasSpecDump: true, brand: 'Dell', device_type: 'Laptop', ram: '32GB', storage: '1TB SSD', operating_system: 'Windows 11 Pro' },
  },
  {
    tag: 'MDOC-CAI-WIN-ML001',
    name: 'MSI - Katana 15 15.6" 144Hz FHD Gaming Laptop-Ryzen 9-8945HS with 16GB Memory-RTX 4070-1TB SSD - Black',
    expect: { wasSpecDump: true, brand: 'MSI', device_type: 'Laptop', ram: '16GB', storage: '1TB SSD', color: 'Black' },
  },
]

for (const sample of auditSamples) {
  const parsed = parseSpecDump(sample.name)
  if (!parsed.wasSpecDump) {
    console.error(`FAIL ${sample.tag}: expected wasSpecDump=true`)
    process.exit(1)
  }
  for (const [key, value] of Object.entries(sample.expect)) {
    if (key === 'wasSpecDump') continue
    if (String(parsed[key] ?? '') !== value) {
      console.error(`FAIL ${sample.tag} ${key}: expected "${value}", got "${parsed[key] ?? ''}"`)
      process.exit(1)
    }
  }
  console.log(`${sample.tag} audit sample passed → "${parsed.name}"`)
}

console.log(JSON.stringify(data, null, 2))
