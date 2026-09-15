/**
 * End-to-end check of GriffinEye text intake ("Describe it"): signs in as a real
 * user, sends descriptions through /api/griffineye-describe, saves one reviewed
 * draft through /api/assets, and confirms metering plus AI audit logging.
 *
 * Requires the app to be running. Any asset it creates is deleted afterwards so
 * the script is safe to re-run against a seeded org.
 *
 * Run:
 *   node --env-file=.env.local scripts/verify-griffineye-describe.mjs <email> <password> [baseUrl]
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const [email, password, baseUrlArg] = process.argv.slice(2)
const baseUrl = baseUrlArg ?? 'http://localhost:3000'

if (!url || !anonKey || !serviceKey || !email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/verify-griffineye-describe.mjs <email> <password> [baseUrl]')
  process.exit(1)
}

const DESCRIPTIONS = [
  {
    text: 'Dell Latitude 5440 laptop for Maya in New York HQ, serial 7XK91P2',
    expect: {
      manufacturer: /dell/i,
      model: /latitude/i,
      serialNumber: /7XK91P2/i,
      category: 'Laptop',
      assignedTo: /maya/i,
      location: /new york/i,
    },
  },
  {
    text: 'milwaukee cordless drill in warehouse a, small dent on the casing',
    expect: { manufacturer: /milwaukee/i, category: 'Tool', conditionNotes: /dent/i, location: /warehouse a/i },
  },
  {
    // A fragment: should still extract what it can rather than refuse.
    text: 'dell laptop for maya',
    expect: { manufacturer: /dell/i, category: 'Laptop', assignedTo: /maya/i },
  },
  {
    // Product name implies the maker; an explicit non-assignment stays empty.
    text: 'MacBook Pro 14 inch, brand new, assigned to nobody yet',
    expect: { manufacturer: /apple/i, category: 'Laptop', assignedTo: '' },
  },
]

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

const json = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
  body: JSON.stringify(body),
})

let failures = 0
const fail = (message) => {
  console.log(`   ✗ ${message}`)
  failures += 1
}

const { data: profile, error: profileError } = await admin
  .from('profiles')
  .select('organization_id')
  .eq('email', email)
  .single()

if (profileError || !profile) {
  console.error('Profile lookup failed:', profileError?.message ?? 'not found')
  process.exit(1)
}

const org = profile.organization_id
const runStartedAt = new Date().toISOString()

const { count: baselineUsage, error: baselineUsageError } = await admin
  .from('ai_usage_log')
  .select('id', { count: 'exact', head: true })
  .eq('organization_id', org)
  .eq('usage_type', 'griffineye_text_extract')

if (baselineUsageError) {
  console.error('Baseline usage lookup failed:', baselineUsageError.message)
  process.exit(1)
}

console.log(`Extracting ${DESCRIPTIONS.length} descriptions via ${baseUrl}/api/griffineye-describe\n`)

let firstDraft = null
let successfulExtractions = 0

for (const { text, expect } of DESCRIPTIONS) {
  const startedAt = Date.now()
  console.log(`"${text}"`)

  const response = await fetch(`${baseUrl}/api/griffineye-describe`, json({ description: text }))
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
  const data = await response.json().catch(() => null)

  if (!response.ok || !data) {
    fail(`${response.status}: ${data?.error ?? 'no body'} (${elapsed}s)`)
    continue
  }

  console.log(`   summary: ${data.summary}`)
  console.log(
    `   fields: manufacturer=${data.manufacturer || '—'} model=${data.model || '—'} ` +
      `serial=${data.serialNumber || '—'} tag=${data.assetTag || '—'} category=${data.category} ` +
      `assignedTo=${data.assignedTo || '—'} location=${data.location || '—'} ` +
      `condition=${data.conditionNotes || '—'}`,
  )
  console.log(`   suggested: [${data.suggestedFields.join(', ')}]  uncertain: [${data.uncertainFields.join(', ')}]`)
  if (data.notes) console.log(`   notes: ${data.notes}`)
  console.log(`   confidence: ${data.confidence} · usage ${data.usage?.used}/${data.usage?.cap} · ${elapsed}s`)

  for (const [field, matcher] of Object.entries(expect)) {
    const actual = data[field] ?? ''
    const ok = typeof matcher === 'string' ? actual === matcher : matcher.test(actual)
    if (!ok) fail(`expected ${field} to match ${matcher}, got "${actual}"`)
  }

  // A guessed value must never be presented as a GriffinEye suggestion.
  for (const field of data.suggestedFields) {
    if (!data[field]) fail(`${field} is marked suggested but is empty`)
    if (data.uncertainFields.includes(field)) fail(`${field} is both suggested and uncertain`)
  }

  successfulExtractions += 1

  if (!firstDraft) {
    firstDraft = {
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      category: data.category,
      assetTag: data.assetTag,
      summary: data.summary,
      notes: data.notes,
      conditionNotes: data.conditionNotes,
      assignedTo: data.assignedTo,
      location: data.location,
    }
  }

  console.log('')
}

console.log('Input validation:')
for (const [label, description, expectedStatus] of [
  ['empty', '', 400],
  ['too short', 'ab', 400],
  ['too long', 'x'.repeat(1001), 400],
]) {
  const response = await fetch(`${baseUrl}/api/griffineye-describe`, json({ description }))
  const data = await response.json().catch(() => null)
  const ok = response.status === expectedStatus
  console.log(`  ${ok ? '·' : '✗'} ${label}: ${response.status} ${data?.error ?? ''}`)
  if (!ok) failures += 1
}

// Nothing may reach the database until the user confirms the reviewed draft.
console.log('\nSaving the reviewed draft:')
let createdAssetId = null

if (firstDraft) {
  const response = await fetch(`${baseUrl}/api/assets`, json(firstDraft))
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.asset) {
    fail(`save failed: ${response.status} ${data?.error ?? ''}`)
  } else {
    createdAssetId = data.asset.id
    console.log(`  saved ${data.asset.asset_tag} · ${data.asset.name} · ${data.asset.category}`)
    console.log(`  serial=${data.asset.serial || '—'} status=${data.asset.status}`)
    console.log(`  assigned_to=${data.asset.assigned_to} location=${data.asset.location || '—'}`)

    // The owner and location named in the description must survive the save.
    if (!/maya/i.test(data.asset.assigned_to)) fail(`assigned_to did not persist: "${data.asset.assigned_to}"`)
    if (!/new york/i.test(data.asset.location)) fail(`location did not persist: "${data.asset.location}"`)

    const listResponse = await fetch(`${baseUrl}/api/assets`, { headers: { Cookie: cookieHeader } })
    const list = await listResponse.json().catch(() => null)
    const savedTag = data.asset.asset_tag
    const found = (list?.assets ?? []).some((asset) => asset.id === savedTag)
    console.log(`  appears in the asset list: ${found ? 'yes' : 'no'}`)
    if (!found) failures += 1
  }
}

const { count: afterUsage, error: afterUsageError } = await admin
  .from('ai_usage_log')
  .select('id', { count: 'exact', head: true })
  .eq('organization_id', org)
  .eq('usage_type', 'griffineye_text_extract')

if (afterUsageError) {
  fail(`usage lookup failed: ${afterUsageError.message}`)
} else {
  const usageDelta = (afterUsage ?? 0) - (baselineUsage ?? 0)
  console.log(`\nai_usage_log griffineye_text_extract delta: +${usageDelta} (baseline ${baselineUsage})`)
  if (usageDelta < successfulExtractions) {
    fail(`expected at least ${successfulExtractions} new usage rows, found ${usageDelta}`)
  }
}

const { data: aiEvents, error: auditError } = await admin
  .from('audit_log')
  .select('entity_label, summary, metadata')
  .eq('organization_id', org)
  .eq('category', 'ai')
  .eq('action', 'GriffinEye text extraction')
  .gte('created_at', runStartedAt)
  .order('created_at', { ascending: false })

if (auditError) {
  fail(`audit lookup failed: ${auditError.message}`)
} else {
  console.log(`AI audit events from this run: ${aiEvents?.length ?? 0}`)
  if ((aiEvents?.length ?? 0) < successfulExtractions) {
    fail(
      `expected at least ${successfulExtractions} audit events since ${runStartedAt}, found ${aiEvents?.length ?? 0}`,
    )
  }
  for (const event of aiEvents ?? []) {
    console.log(`  "${event.entity_label}" → ${event.summary} (confidence ${event.metadata?.confidence})`)
  }
}

// Leave the seeded dataset exactly as it was so counts stay stable across runs.
if (createdAssetId) {
  const { error } = await admin.from('assets').delete().eq('id', createdAssetId)
  console.log(error ? `\ncleanup failed: ${error.message}` : '\ncleaned up the test asset')
}

console.log(failures > 0 ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures > 0 ? 1 : 0)
