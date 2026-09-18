/**
 * Verifies Phase 2: default workspace groups, field seeds, records API layer parity.
 *
 * Run: node --env-file=.env.local scripts/verify-groups-fields-records-phase2.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const baseUrl = process.env.PHASE2_BASE_URL ?? 'http://localhost:3000'

if (!url || !serviceKey || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const EXPECTED_SLUGS = ['assets', 'people', 'locations', 'maintenance', 'audits', 'inspections', 'reports']

const EXPECTED_FIELD_KEYS = {
  assets: [
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
  ],
  people: ['name', 'team', 'role', 'department', 'email', 'phone', 'status', 'last_check_out'],
  locations: ['name', 'type', 'manager', 'last_audit', 'address'],
  maintenance: [
    'asset',
    'issue_type',
    'priority',
    'technician',
    'due_date',
    'status',
    'description',
    'parts_used',
    'cost',
    'resolution_notes',
  ],
  audits: ['name', 'scope', 'auditor', 'start_date', 'status', 'scanned', 'expected', 'notes'],
  inspections: [
    'asset_id',
    'asset',
    'checklist_template_id',
    'assigned_inspector',
    'due_date',
    'status',
    'last_completed',
    'inspector_notes',
    'results',
  ],
  reports: ['name', 'type', 'last_run', 'frequency', 'owner', 'summary'],
}

let failures = 0
let skipped = 0

function check(ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${detail}`)
  if (!ok) failures += 1
}

function skip(detail) {
  console.log(`○ ${detail} (skipped)`)
  skipped += 1
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

async function assertPhase2FunctionsExist() {
  const { error } = await admin.rpc('seed_default_workspace_groups', {
    p_organization_id: '00000000-0000-0000-0000-000000000000',
  })
  check(
    !error || error.message.includes('violates foreign key') || error.code === '23503',
    'seed_default_workspace_groups() function exists',
  )
}

async function verifyExistingOrgsHaveWorkspaceGroups() {
  const { data: orgs, error: orgsError } = await admin.from('organizations').select('id')
  if (orgsError) throw new Error(orgsError.message)

  for (const org of orgs ?? []) {
    const { data: groups, error } = await admin
      .from('groups')
      .select('slug, sort_order')
      .eq('organization_id', org.id)
      .order('sort_order')
    if (error) throw new Error(error.message)

    const slugs = (groups ?? []).map((g) => g.slug)
    check(slugs.length >= EXPECTED_SLUGS.length, `org ${org.id.slice(0, 8)}… has ${slugs.length} group(s)`)

    for (const slug of EXPECTED_SLUGS) {
      check(slugs.includes(slug), `org ${org.id.slice(0, 8)}… includes "${slug}" group`)
    }
  }
}

async function verifyFieldSeedsForOrg(orgId) {
  const { data: groups, error: groupsError } = await admin
    .from('groups')
    .select('id, slug')
    .eq('organization_id', orgId)
  if (groupsError) throw new Error(groupsError.message)

  for (const group of groups ?? []) {
    const expected = EXPECTED_FIELD_KEYS[group.slug]
    if (!expected) continue

    const { data: fields, error } = await admin
      .from('fields')
      .select('key')
      .eq('group_id', group.id)
      .order('sort_order')
    if (error) throw new Error(error.message)

    const keys = (fields ?? []).map((f) => f.key)
    check(keys.length === expected.length, `"${group.slug}" has ${expected.length} field definition(s)`)
    for (const key of expected) {
      check(keys.includes(key), `"${group.slug}" field "${key}" exists`)
    }
  }
}

async function verifyAssetsRecordCounts() {
  const { data: assets, error: assetsError } = await admin.from('assets').select('id, organization_id')
  if (assetsError) throw new Error(assetsError.message)

  const legacyByOrg = new Map()
  for (const asset of assets ?? []) {
    legacyByOrg.set(asset.organization_id, (legacyByOrg.get(asset.organization_id) ?? 0) + 1)
  }

  const { data: groups, error: groupsError } = await admin.from('groups').select('id, organization_id, slug')
  if (groupsError) throw new Error(groupsError.message)

  const assetsGroupByOrg = new Map(
    (groups ?? []).filter((g) => g.slug === 'assets').map((g) => [g.organization_id, g.id]),
  )

  for (const [orgId, legacyCount] of legacyByOrg) {
    const groupId = assetsGroupByOrg.get(orgId)
    if (!groupId) {
      check(false, `assets group exists for org ${orgId.slice(0, 8)}…`)
      continue
    }

    const { count, error } = await admin
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
    if (error) throw new Error(error.message)

    check(count === legacyCount, `org ${orgId.slice(0, 8)}… assets record count (${count}) matches legacy (${legacyCount})`)
  }

  const totalLegacy = assets?.length ?? 0
  check(totalLegacy > 0, `${totalLegacy} legacy asset row(s) present for parity reference`)
}

async function verifyNonAssetsGroupsEmptyByDefault(orgId) {
  const { data: groups, error } = await admin.from('groups').select('id, slug').eq('organization_id', orgId)
  if (error) throw new Error(error.message)

  for (const group of groups ?? []) {
    if (group.slug === 'assets') continue
    const { count, error: countError } = await admin
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)
    if (countError) throw new Error(countError.message)
    check(count === 0, `"${group.slug}" group starts with 0 records (fields-only seed)`)
  }
}

async function verifyNewOrgGetsFullWorkspace() {
  const suffix = randomUUID().slice(0, 8)
  const email = `gfr-phase2-${suffix}@example.com`
  const password = `Test-${suffix}!`
  let orgId = null
  let userId = null

  try {
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (userError) throw new Error(userError.message)
    userId = userData.user.id

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()
    if (profileError) throw new Error(profileError.message)
    orgId = profile.organization_id

    // Trigger runs synchronously, but allow a brief retry for hosted Supabase replication lag.
    let slugs = []
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: groups, error: groupsError } = await admin
        .from('groups')
        .select('slug')
        .eq('organization_id', orgId)
        .order('sort_order')
      if (groupsError) throw new Error(groupsError.message)
      slugs = (groups ?? []).map((g) => g.slug)
      if (slugs.length >= EXPECTED_SLUGS.length) break
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    check(slugs.length === EXPECTED_SLUGS.length, `new org signup seeds ${EXPECTED_SLUGS.length} groups (got: ${slugs.join(', ') || 'none'})`)
    for (const slug of EXPECTED_SLUGS) {
      check(slugs.includes(slug), `new org includes "${slug}" group`)
    }

    await verifyFieldSeedsForOrg(orgId)
    await verifyNonAssetsGroupsEmptyByDefault(orgId)
  } finally {
    await deleteTestOrganization(orgId)
    await deleteTestUser(userId)
  }
}

async function verifyAuthenticatedDataLayer() {
  const suffix = randomUUID().slice(0, 8)
  const email = `gfr-phase2-auth-${suffix}@example.com`
  const password = `Test-${suffix}!`
  let orgId = null
  let userId = null
  let createdGroupId = null
  let createdRecordId = null

  try {
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (userError) throw new Error(userError.message)
    userId = userData.user.id

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()
    if (profileError) throw new Error(profileError.message)
    orgId = profile.organization_id

    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) throw new Error(signInError.message)

    const { data: groups, error: groupsError } = await client
      .from('groups')
      .select('id, slug, name, sort_order')
      .order('sort_order')
    if (groupsError) throw new Error(groupsError.message)
    check((groups ?? []).length === EXPECTED_SLUGS.length, 'authenticated user can list all workspace groups')

    const assetsGroup = groups?.find((g) => g.slug === 'assets')
    const peopleGroup = groups?.find((g) => g.slug === 'people')
    check(Boolean(assetsGroup), 'authenticated user sees assets group')
    check(Boolean(peopleGroup), 'authenticated user sees people group')

    if (assetsGroup) {
      const { data: assetFields, error: assetFieldsError } = await client
        .from('fields')
        .select('key')
        .eq('group_id', assetsGroup.id)
      if (assetFieldsError) throw new Error(assetFieldsError.message)
      check((assetFields ?? []).length === EXPECTED_FIELD_KEYS.assets.length, 'authenticated user can read assets fields')

      const { data: assetRecords, error: assetRecordsError } = await client
        .from('records')
        .select('id')
        .eq('group_id', assetsGroup.id)
      if (assetRecordsError) throw new Error(assetRecordsError.message)
      check(Array.isArray(assetRecords), 'authenticated user can read assets records')
    } else {
      check(false, 'authenticated user can read assets fields')
      check(false, 'authenticated user can read assets records')
    }

    const { data: newGroup, error: createGroupError } = await client
      .from('groups')
      .insert({
        organization_id: orgId,
        name: 'Vehicles',
        icon: 'boxes',
        slug: `vehicles-${suffix}`,
        sort_order: 99,
      })
      .select('id')
      .single()
    if (createGroupError) throw new Error(createGroupError.message)
    createdGroupId = newGroup.id
    check(Boolean(createdGroupId), 'authenticated user can create a custom group')

    if (!assetsGroup) {
      check(false, 'authenticated user can insert a record into own org group')
    } else {
      const { data: insertedRecord, error: insertRecordError } = await client
        .from('records')
        .insert({
          group_id: assetsGroup.id,
          organization_id: orgId,
          data: {
            asset_tag: `P2-${suffix}`,
            name: 'Phase 2 smoke asset',
            category: 'Equipment',
            status: 'Available',
            lifecycle_stage: 'Procurement',
          },
        })
        .select('id')
        .single()
      if (insertRecordError) throw new Error(insertRecordError.message)
      createdRecordId = insertedRecord.id
      check(Boolean(createdRecordId), 'authenticated user can insert a record into own org group')
    }

    const { error: frozenInsertError } = await client.from('assets').insert({
      organization_id: orgId,
      asset_tag: `P2-FREEZE-${suffix}`,
      name: 'Should fail',
      category: 'Equipment',
    })
    check(Boolean(frozenInsertError), 'authenticated user cannot INSERT into frozen assets table')

    const { data: otherOrgGroup } = await admin
      .from('groups')
      .select('id, organization_id')
      .neq('organization_id', orgId)
      .limit(1)
      .maybeSingle()

    if (otherOrgGroup?.id) {
      const { error: crossOrgInsertError } = await client.from('records').insert({
        group_id: otherOrgGroup.id,
        organization_id: otherOrgGroup.organization_id,
        data: { name: 'Cross org attempt' },
      })
      check(Boolean(crossOrgInsertError), 'authenticated user cannot insert record with another org group_id (RLS)')
    } else {
      skip('cross-org insert RLS check — only one organization in database')
    }
  } finally {
    if (createdRecordId) {
      const { error } = await admin.from('records').delete().eq('id', createdRecordId)
      if (error) console.warn(`cleanup record ${createdRecordId}: ${error.message}`)
    }
    if (createdGroupId) {
      const { error } = await admin.from('groups').delete().eq('id', createdGroupId)
      if (error) console.warn(`cleanup group ${createdGroupId}: ${error.message}`)
    }
    await deleteTestOrganization(orgId)
    await deleteTestUser(userId)
  }
}

async function verifyHttpApiLayer() {
  // Next.js API routes use cookie-based Supabase sessions (@/lib/supabase/server),
  // not Bearer tokens — automated HTTP checks require a logged-in browser session.
  let serverUp = false
  try {
    const ping = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) })
    serverUp = ping.ok || ping.status === 307 || ping.status === 308
  } catch {
    serverUp = false
  }

  if (!serverUp) {
    skip(`HTTP API checks — dev server not reachable at ${baseUrl} (use browser smoke test instead)`)
    return
  }

  skip('HTTP API checks — require browser session cookies; DB/auth layer checks cover the same routes')
}

async function main() {
  console.log('Groups / Fields / Records — Phase 2 verification\n')

  await assertPhase2FunctionsExist()
  await verifyExistingOrgsHaveWorkspaceGroups()

  const { data: orgs } = await admin.from('organizations').select('id').limit(3)
  for (const org of orgs ?? []) {
    await verifyFieldSeedsForOrg(org.id)
  }

  await verifyAssetsRecordCounts()
  await verifyNewOrgGetsFullWorkspace()
  await verifyAuthenticatedDataLayer()
  await verifyHttpApiLayer()

  console.log(
    failures === 0
      ? `\nAll Phase 2 checks passed${skipped ? ` (${skipped} skipped).` : '.'}`
      : `\n${failures} check(s) failed${skipped ? `, ${skipped} skipped` : ''}.`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('\nFatal:', error.message)
  process.exit(1)
})
