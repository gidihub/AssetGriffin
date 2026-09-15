/**
 * Checks that the categorized activity timeline captures real work: an AI query,
 * a text extraction, a record creation, and a spreadsheet import each land in
 * the right sub-log, and that /api/audit-log serves them back scoped to the org.
 *
 * Requires the app to be running. Cleans up the rows it creates.
 *
 * Run:
 *   node --env-file=.env.local scripts/verify-griffineye-audit.mjs <email> <password> [baseUrl]
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const [email, password, baseUrlArg] = process.argv.slice(2)
const baseUrl = baseUrlArg ?? 'http://localhost:3000'

if (!url || !anonKey || !serviceKey || !email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/verify-griffineye-audit.mjs <email> <password> [baseUrl]')
  process.exit(1)
}

const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({ email, password })
if (signInError || !signIn.session) {
  console.error('Sign in failed:', signInError?.message)
  process.exit(1)
}

const projectRef = new URL(url).hostname.split('.')[0]
const cookieHeader = `sb-${projectRef}-auth-token=base64-${Buffer.from(
  JSON.stringify(signIn.session),
  'utf8',
).toString('base64url')}`

const post = (path, body) =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify(body),
  })

let failures = 0
const fail = (message) => {
  console.log(`  ✗ ${message}`)
  failures += 1
}

const startedAt = new Date().toISOString()
const importTag = `AUDITTEST-${Date.now().toString(36).toUpperCase()}`
const createdAssetIds = []

console.log('Generating one action per sub-log…\n')

// ai — natural-language query
const queryResponse = await post('/api/griffineye-query', { question: 'How many assets are in maintenance?' })
console.log(`  ai (query): ${queryResponse.status}`)
if (!queryResponse.ok) fail('query request failed')

// ai — text extraction
const describeResponse = await post('/api/griffineye-describe', {
  description: 'Bosch GLL 3-80 laser level for the field ops team in Warehouse A',
})
const describeData = await describeResponse.json().catch(() => null)
console.log(`  ai (text extraction): ${describeResponse.status}`)
if (!describeResponse.ok) fail('describe request failed')

// record — saving the reviewed draft
if (describeData && !describeData.error) {
  const saveResponse = await post('/api/assets', {
    manufacturer: describeData.manufacturer,
    model: describeData.model,
    serialNumber: describeData.serialNumber,
    category: describeData.category,
    assetTag: '',
    summary: describeData.summary,
    notes: describeData.notes,
    conditionNotes: describeData.conditionNotes,
    assignedTo: describeData.assignedTo,
    location: describeData.location,
  })
  const saveData = await saveResponse.json().catch(() => null)
  console.log(`  record (asset created): ${saveResponse.status}`)
  if (!saveResponse.ok) fail('asset save failed')
  else createdAssetIds.push(saveData.asset.id)
}

// import — spreadsheet commit
const importResponse = await post('/api/assets/import', {
  records: [
    {
      asset_tag: importTag,
      name: 'Audit test widget',
      category: 'Equipment',
      assigned_to: 'Unassigned',
      location: 'Warehouse A',
      status: 'Available',
      serial: '',
    },
  ],
})
const importData = await importResponse.json().catch(() => null)
console.log(`  import (spreadsheet): ${importResponse.status}`)
if (!importResponse.ok) fail(`import failed: ${importData?.error ?? ''}`)
else for (const asset of importData.assets ?? []) createdAssetIds.push(asset.id)

// Every action above must show up in its own sub-log, via the API the UI uses.
console.log('\nReading back through /api/audit-log:')
const expectedActions = {
  ai: ['GriffinEye query', 'GriffinEye text extraction'],
  record: ['Created asset'],
  import: ['Imported spreadsheet', 'Imported asset'],
}

for (const [category, actions] of Object.entries(expectedActions)) {
  const response = await fetch(`${baseUrl}/api/audit-log?category=${category}`, {
    headers: { Cookie: cookieHeader },
  })
  const data = await response.json().catch(() => null)

  if (!response.ok || !data) {
    fail(`${category}: ${response.status} ${data?.error ?? ''}`)
    continue
  }

  const fresh = (data.events ?? []).filter((event) => event.created_at >= startedAt)
  console.log(`  ${category}: ${data.events.length} total, ${fresh.length} from this run`)

  for (const event of fresh.slice(0, 3)) {
    console.log(`     ${event.action} · ${event.entity_label || '—'} · via ${event.source}`)
  }

  for (const action of actions) {
    if (!fresh.some((event) => event.action === action)) fail(`${category} log is missing "${action}"`)
  }

  // A category filter that leaks other categories would break the tabs.
  const wrongCategory = (data.events ?? []).find((event) => event.category !== category)
  if (wrongCategory) fail(`${category} filter returned a ${wrongCategory.category} event`)
}

// The "All activity" tab and its badge counts.
const allResponse = await fetch(`${baseUrl}/api/audit-log`, { headers: { Cookie: cookieHeader } })
const allData = await allResponse.json().catch(() => null)
console.log(`\nAll activity: ${allData?.events?.length ?? 0} events returned`)
console.log(`Tab counts: ${JSON.stringify(allData?.counts ?? {})}`)

if (!allData?.counts || Object.values(allData.counts).every((count) => count === 0)) {
  fail('tab counts came back empty')
}

// Org scoping: the API must never return another organization's events.
const { data: profile } = await admin.from('profiles').select('organization_id').eq('email', email).single()
const org = profile.organization_id
const { count: foreignCount } = await admin
  .from('audit_log')
  .select('id', { count: 'exact', head: true })
  .neq('organization_id', org)

const leaked = (allData?.events ?? []).some((event) => event.organization_id !== org)
console.log(`Events in other orgs: ${foreignCount} · leaked into this response: ${leaked ? 'yes' : 'no'}`)
if (leaked) fail('audit-log returned events from another organization')

// Clean up so repeat runs stay comparable.
if (createdAssetIds.length) {
  await admin.from('audit_log').delete().in('entity_id', createdAssetIds)
  const { error } = await admin.from('assets').delete().in('id', createdAssetIds)
  console.log(error ? `\ncleanup failed: ${error.message}` : `\ncleaned up ${createdAssetIds.length} test asset(s)`)
}

console.log(failures > 0 ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures > 0 ? 1 : 0)
