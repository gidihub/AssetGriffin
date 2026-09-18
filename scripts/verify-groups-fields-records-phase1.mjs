/**
 * Verifies Phase 1: groups / fields / records schema + assets migration parity.
 *
 * Run: node --env-file=.env.local scripts/verify-groups-fields-records-phase1.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !serviceKey || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const ASSET_RECORD_KEYS = [
  'asset_tag',
  'name',
  'category',
  'assigned_to',
  'location',
  'status',
  'purchase_date',
  'serial',
  'warranty_expiration',
  'depreciation_value',
  'purchase_value',
  'notes',
  'lifecycle_stage',
  'lifecycle_dates',
  'it_details',
]

const EXPECTED_ASSET_FIELD_KEYS = [...ASSET_RECORD_KEYS]

let failures = 0

function check(ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${detail}`)
  if (!ok) failures += 1
}

async function deleteTestOrganization(orgId) {
  if (!orgId) return
  const { error } = await admin.from('organizations').delete().eq('id', orgId)
  if (error) console.warn(`cleanup organization ${orgId}: ${error.message}`)
}

async function deleteTestUser(userId) {
  if (!userId) return
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) console.warn(`cleanup user ${userId}: ${error.message}`)
}

function normalizeDateValue(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const parsed = new Date(trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
    return trimmed
  }
  return String(value)
}

function normalizeNumberValue(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function assetRowToExpectedData(asset) {
  return {
    asset_tag: String(asset.asset_tag ?? ''),
    name: String(asset.name ?? ''),
    category: String(asset.category ?? ''),
    assigned_to: String(asset.assigned_to ?? ''),
    location: String(asset.location ?? ''),
    status: String(asset.status ?? ''),
    purchase_date: normalizeDateValue(asset.purchase_date),
    serial: String(asset.serial ?? ''),
    warranty_expiration: normalizeDateValue(asset.warranty_expiration),
    depreciation_value: String(asset.depreciation_value ?? ''),
    purchase_value: normalizeNumberValue(asset.purchase_value),
    notes: String(asset.notes ?? ''),
    lifecycle_stage: String(asset.lifecycle_stage ?? ''),
    lifecycle_dates:
      asset.lifecycle_dates && typeof asset.lifecycle_dates === 'object' && !Array.isArray(asset.lifecycle_dates)
        ? asset.lifecycle_dates
        : {},
    it_details:
      asset.it_details && typeof asset.it_details === 'object' && !Array.isArray(asset.it_details)
        ? asset.it_details
        : null,
  }
}

function compareAssetToRecordData(assetId, legacy, recordData) {
  const expected = assetRowToExpectedData(legacy)
  const actual = assetRowToExpectedData(recordData)
  const mismatches = []

  for (const key of ASSET_RECORD_KEYS) {
    const left = expected[key]
    const right = actual[key]

    if (key === 'lifecycle_dates' || key === 'it_details') {
      const leftJson = JSON.stringify(left ?? (key === 'lifecycle_dates' ? {} : null))
      const rightJson = JSON.stringify(right ?? (key === 'lifecycle_dates' ? {} : null))
      if (leftJson !== rightJson) mismatches.push({ assetId, field: key, legacy: left, record: right })
      continue
    }

    if (left !== right) mismatches.push({ assetId, field: key, legacy: left, record: right })
  }

  return mismatches
}

async function tableExists(name) {
  const { error } = await admin.from(name).select('id').limit(1)
  if (!error) return true
  if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) return false
  throw new Error(`${name}: ${error.message}`)
}

async function assertSchemaApplied() {
  for (const table of ['groups', 'fields', 'records']) {
    check(await tableExists(table), `public.${table} table exists`)
  }

  const { error: seedError } = await admin.rpc('seed_default_assets_group', {
    p_organization_id: '00000000-0000-0000-0000-000000000000',
  })
  check(
    !seedError || seedError.message.includes('violates foreign key') || seedError.code === '23503',
    'seed_default_assets_group() function exists',
  )

  if (!(await tableExists('groups')) || !(await tableExists('fields')) || !(await tableExists('records'))) {
    throw new Error(
      'Migration 20260914180000_groups_fields_records_phase1.sql is not applied — run it in the Supabase SQL editor first.',
    )
  }
}

async function verifyAssetsFrozen(organizationId, userClient) {
  const tag = `FREEZE-${randomUUID().slice(0, 8)}`
  const { error: insertError } = await userClient.from('assets').insert({
    organization_id: organizationId,
    asset_tag: tag,
    name: 'Should fail',
    category: 'Equipment',
  })
  check(Boolean(insertError), 'authenticated users cannot INSERT into frozen assets table')

  const { data: assets, error: selectError } = await userClient.from('assets').select('id').limit(1)
  check(!selectError && Array.isArray(assets), 'authenticated users can still SELECT legacy assets for parity checks')
}

async function verifyNewOrgSeeding() {
  const suffix = randomUUID().slice(0, 8)
  const email = `gfr-phase1-${suffix}@example.com`
  const password = `Test-${suffix}!`

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (userError) throw new Error(`createUser: ${userError.message}`)

  const userId = userData.user.id
  let orgId = null

  try {
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()
    if (profileError) throw new Error(`profiles lookup failed: ${profileError.message}`)
    if (!profile?.organization_id) throw new Error('profiles lookup failed: organization_id missing')

    orgId = profile.organization_id

    const { data: groups, error: groupsError } = await admin
      .from('groups')
      .select('id, slug')
      .eq('organization_id', orgId)
    if (groupsError) throw new Error(`groups lookup failed: ${groupsError.message}`)

    const assetsGroup = groups?.find((g) => g.slug === 'assets')
    check(Boolean(assetsGroup), 'new org signup seeds an Assets group')

    if (!assetsGroup) return

    const { data: fields, error: fieldsError } = await admin
      .from('fields')
      .select('key, type')
      .eq('group_id', assetsGroup.id)
      .order('sort_order')
    if (fieldsError) throw new Error(fieldsError.message)

    const fieldKeys = (fields ?? []).map((f) => f.key)
    check(fieldKeys.length === EXPECTED_ASSET_FIELD_KEYS.length, `Assets group has ${EXPECTED_ASSET_FIELD_KEYS.length} field definitions`)

    for (const key of EXPECTED_ASSET_FIELD_KEYS) {
      check(fieldKeys.includes(key), `field "${key}" exists on new org Assets group`)
    }

    const jsonFields = (fields ?? []).filter((f) => f.type === 'json').map((f) => f.key)
    check(
      jsonFields.every((k) => k === 'lifecycle_dates' || k === 'it_details'),
      'json type is only used for lifecycle_dates and it_details',
    )
  } finally {
    await deleteTestOrganization(orgId)
    await deleteTestUser(userId)
  }
}

async function verifyMigrationParity() {
  const { data: assets, error: assetsError } = await admin
    .from('assets')
    .select(
      'id, organization_id, asset_tag, name, category, assigned_to, location, status, purchase_date, serial, warranty_expiration, depreciation_value, purchase_value, notes, lifecycle_stage, lifecycle_dates, it_details, created_at, updated_at',
    )
  if (assetsError) throw new Error(assetsError.message)

  const legacyRows = assets ?? []
  check(true, `${legacyRows.length} legacy asset row(s) found`)

  const { data: groups, error: groupsError } = await admin.from('groups').select('id, organization_id, slug')
  if (groupsError) throw new Error(groupsError.message)

  const assetsGroups = (groups ?? []).filter((g) => g.slug === 'assets')
  const groupByOrg = new Map(assetsGroups.map((g) => [g.organization_id, g.id]))

  const { data: records, error: recordsError } = await admin
    .from('records')
    .select('id, group_id, organization_id, data, created_at, updated_at')
  if (recordsError) throw new Error(recordsError.message)

  const migratedAssetRecords = (records ?? []).filter((r) => {
    const groupId = groupByOrg.get(r.organization_id)
    return groupId === r.group_id
  })

  const legacyIds = new Set(legacyRows.map((asset) => asset.id))
  const migratedFromLegacy = migratedAssetRecords.filter((r) => legacyIds.has(r.id))
  const extraAssetRecords = migratedAssetRecords.filter((r) => !legacyIds.has(r.id))

  check(
    migratedFromLegacy.length === legacyRows.length,
    `migrated record count (${migratedFromLegacy.length}) matches legacy asset count (${legacyRows.length})`,
  )
  if (extraAssetRecords.length) {
    check(
      true,
      `${extraAssetRecords.length} additional asset-group record(s) beyond legacy migration (e.g. intake drafts)`,
    )
  }

  const recordById = new Map(migratedFromLegacy.map((r) => [r.id, r]))
  let mismatchTotal = 0
  let timestampMismatches = 0

  for (const asset of legacyRows) {
    const record = recordById.get(asset.id)
    check(Boolean(record), `record exists with same id as asset ${asset.id}`)

    if (!record) continue

    const mismatches = compareAssetToRecordData(asset.id, asset, record.data ?? {})
    if (mismatches.length) {
      mismatchTotal += mismatches.length
      for (const m of mismatches.slice(0, 3)) {
        console.log(`    mismatch ${asset.id}.${m.field}: legacy=${JSON.stringify(m.legacy)} record=${JSON.stringify(m.record)}`)
      }
    }

    if (record.created_at !== asset.created_at) timestampMismatches += 1
    if (record.updated_at !== asset.updated_at) timestampMismatches += 1
  }

  check(mismatchTotal === 0, `field-level data parity across all ${legacyRows.length} migrated asset(s)`)
  check(timestampMismatches === 0, 'created_at / updated_at timestamps preserved on migrated records')
}

async function verifyRlsIsolation() {
  const suffix = randomUUID().slice(0, 8)
  const emailA = `gfr-a-${suffix}@example.com`
  const emailB = `gfr-b-${suffix}@example.com`
  const password = `Test-${suffix}!`
  const created = []
  let rlsRecordId = null

  try {
    for (const email of [emailA, emailB]) {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (error) throw new Error(`createUser ${email}: ${error.message}`)
      created.push({ userId: data.user.id, email })
    }

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, email, organization_id')
      .in('email', [emailA, emailB])
    if (profilesError) throw new Error(`profiles lookup failed: ${profilesError.message}`)
    if (!profiles?.length) throw new Error('profiles lookup failed: no profiles returned for test users')

    for (const profile of profiles) {
      const entry = created.find((c) => c.userId === profile.id)
      if (entry) entry.organizationId = profile.organization_id
    }

    const orgA = created.find((c) => c.email === emailA)
    const orgB = created.find((c) => c.email === emailB)
    if (!orgA?.organizationId) throw new Error('profiles lookup failed: org A organization_id missing')
    if (!orgB?.organizationId) throw new Error('profiles lookup failed: org B organization_id missing')

    const { data: groupA, error: groupError } = await admin
      .from('groups')
      .select('id')
      .eq('organization_id', orgA.organizationId)
      .eq('slug', 'assets')
      .single()
    if (groupError) throw new Error(`groups lookup failed: ${groupError.message}`)
    if (!groupA?.id) throw new Error('groups lookup failed: assets group missing for org A')

    const tag = `RLS-${suffix}`
    const { data: insertedRecord, error: insertError } = await admin.from('records').insert({
      group_id: groupA.id,
      organization_id: orgA.organizationId,
      data: { asset_tag: tag, name: 'RLS test asset', category: 'Equipment', status: 'Available', lifecycle_stage: 'Procurement' },
    }).select('id').single()
    if (insertError) throw new Error(`records insert failed: ${insertError.message}`)
    rlsRecordId = insertedRecord?.id ?? null

    const clientA = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const clientB = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })

    const { error: signInA } = await clientA.auth.signInWithPassword({ email: emailA, password })
    const { error: signInB } = await clientB.auth.signInWithPassword({ email: emailB, password })
    if (signInA || signInB) throw new Error('signIn failed')

    const { data: visibleA } = await clientA.from('records').select('data').eq('organization_id', orgA.organizationId)
    const { data: visibleB } = await clientB.from('records').select('data').eq('organization_id', orgA.organizationId)

    check((visibleA ?? []).some((r) => r.data?.asset_tag === tag), 'org A can read its own records')
    check(!(visibleB ?? []).some((r) => r.data?.asset_tag === tag), 'org B cannot read org A records (RLS)')

    await verifyAssetsFrozen(orgA.organizationId, clientA)
  } finally {
    if (rlsRecordId) {
      const { error } = await admin.from('records').delete().eq('id', rlsRecordId)
      if (error) console.warn(`cleanup RLS test record ${rlsRecordId}: ${error.message}`)
    }
    for (const { organizationId } of created) {
      await deleteTestOrganization(organizationId)
    }
    for (const { userId } of created) {
      await deleteTestUser(userId)
    }
  }
}

async function cleanupOrphanTestRecords() {
  const { data: testProfiles, error: profilesError } = await admin
    .from('profiles')
    .select('organization_id')
    .or('email.like.gfr-a-%,email.like.gfr-b-%,email.like.gfr-phase1-%')
  if (profilesError) {
    console.warn(`cleanup orphan test records: profile lookup failed: ${profilesError.message}`)
    return
  }

  const orgIds = [...new Set((testProfiles ?? []).map((row) => row.organization_id).filter(Boolean))]
  if (!orgIds.length) return

  const { data, error } = await admin
    .from('records')
    .select('id')
    .in('organization_id', orgIds)
    .filter('data->>asset_tag', 'like', 'RLS-%')
  if (error) return
  const ids = (data ?? []).map((row) => row.id)
  if (!ids.length) return
  const { error: deleteError } = await admin.from('records').delete().in('id', ids)
  if (deleteError) console.warn(`cleanup orphan RLS test records: ${deleteError.message}`)
}

async function main() {
  console.log('Groups / Fields / Records — Phase 1 verification\n')

  await cleanupOrphanTestRecords()
  await assertSchemaApplied()
  await verifyMigrationParity()
  await verifyNewOrgSeeding()
  await verifyRlsIsolation()

  console.log(failures === 0 ? '\nAll Phase 1 checks passed.' : `\n${failures} check(s) failed.`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('\nFatal:', error.message)
  process.exit(1)
})
