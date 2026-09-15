/**
 * Seeds the demo asset directory into a real organization so the workspace runs
 * on live Supabase data instead of the mock arrays in lib/workspace-data.ts.
 *
 * Also writes matching audit_log history so change-history questions have
 * something real to return.
 *
 * Run:   node --env-file=.env.local scripts/seed-demo-assets.mjs [user-email]
 * Reset: node --env-file=.env.local scripts/seed-demo-assets.mjs [user-email] --reset
 *   (--reset requires localhost, SEED_ALLOWLIST_PROJECT_REFS, or SEED_RESET_CONFIRM=<project-ref>)
 *
 * With no email, seeds the only organization in the project (dev default).
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const args = process.argv.slice(2)
const reset = args.includes('--reset')
const email = args.find((arg) => !arg.startsWith('--'))

function supabaseProjectRef(projectUrl) {
  try {
    return new URL(projectUrl).hostname.split('.')[0]
  } catch {
    return null
  }
}

function assertDevEnvironment() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const projectRef = supabaseProjectRef(projectUrl)
  const isLocal = /localhost|127\.0\.0\.1/.test(projectUrl)

  const allowlisted = (process.env.SEED_ALLOWLIST_PROJECT_REFS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  const isAllowlisted = Boolean(projectRef && allowlisted.includes(projectRef))
  const resetConfirm = process.env.SEED_RESET_CONFIRM?.trim()
  const isProjectConfirmed = Boolean(projectRef && resetConfirm && resetConfirm === projectRef)
  const isEnvTiedToProject =
    process.env.SUPABASE_ENV === 'development' &&
    Boolean(projectRef && resetConfirm && resetConfirm === projectRef)

  if (!isLocal && !isAllowlisted && !isProjectConfirmed && !isEnvTiedToProject) {
    throw new Error(
      '--reset blocked: target must be localhost, listed in SEED_ALLOWLIST_PROJECT_REFS, ' +
        'or confirmed with SEED_RESET_CONFIRM=<project-ref>. NODE_ENV alone is not sufficient.',
    )
  }
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Mirrors the `previewAssets` array in lib/workspace-data.ts, in database shape. */
const seedAssets = [
  { asset_tag: 'NST-1048', name: 'MacBook Pro 14”', category: 'Computers', assigned_to: 'Maya Patel', location: 'New York HQ', status: 'In use', purchase_date: '2024-02-12', serial: 'C02ZK1A4MD6M', warranty_expiration: '2027-02-12', purchase_value: 1840, notes: 'Assigned during onboarding.', lifecycle_stage: 'Deployed', lifecycle_dates: { Procurement: '2024-02-12', Deployed: '2024-02-20' } },
  { asset_tag: 'NST-1047', name: 'Dell Latitude 5440', category: 'Computers', assigned_to: 'Unassigned', location: 'Austin Depot', status: 'Available', purchase_date: '2023-11-03', serial: '7XK91P2', warranty_expiration: '2026-11-03', purchase_value: 620, notes: 'Returned from Jordan Lee, awaiting reissue.', lifecycle_stage: 'Procurement', lifecycle_dates: { Procurement: '2023-11-03' } },
  { asset_tag: 'NST-1041', name: 'Herman Miller Aeron', category: 'Furniture', assigned_to: 'Jordan Lee', location: 'New York HQ', status: 'In use', purchase_date: '2022-05-18', serial: 'AER-88210', warranty_expiration: '2032-05-18', purchase_value: 740, notes: '', lifecycle_stage: 'Deployed', lifecycle_dates: { Procurement: '2022-05-18', Deployed: '2022-05-24' } },
  { asset_tag: 'NST-1032', name: 'Sony FX3 Camera', category: 'Equipment', assigned_to: 'Studio team', location: 'Chicago Studio', status: 'In maintenance', purchase_date: '2023-08-09', serial: 'SNY-220941', warranty_expiration: '2025-08-09', purchase_value: 2980, notes: 'In for sensor calibration.', lifecycle_stage: 'In Maintenance', lifecycle_dates: { Procurement: '2023-08-09', Deployed: '2023-08-15', 'In Maintenance': '2026-09-05' } },
  { asset_tag: 'NST-1029', name: 'iPad Pro 12.9”', category: 'Tablets', assigned_to: 'Unassigned', location: 'New York HQ', status: 'Available', purchase_date: '2024-01-22', serial: 'DMQ9P2K3', warranty_expiration: '2026-01-22', purchase_value: 980, notes: '', lifecycle_stage: 'Procurement', lifecycle_dates: { Procurement: '2024-01-22' } },
  { asset_tag: 'NST-1052', name: 'Dell U2723QE', category: 'Displays', assigned_to: 'Unassigned', location: 'New York HQ', status: 'Available', purchase_date: '2024-03-04', serial: 'U27-90211', warranty_expiration: '2027-03-04', purchase_value: 410, notes: '', lifecycle_stage: 'Procurement', lifecycle_dates: { Procurement: '2024-03-04' } },
  { asset_tag: 'NST-1055', name: 'Hilti TE 30-A36', category: 'Tools', assigned_to: 'Marcus Lee', location: 'Site 04', status: 'In maintenance', purchase_date: '2021-06-14', serial: 'HLT-30A-6631', warranty_expiration: '2024-06-14', purchase_value: 210, notes: 'Annual calibration in progress.', lifecycle_stage: 'In Maintenance', lifecycle_dates: { Procurement: '2021-06-14', Deployed: '2021-06-20', 'In Maintenance': '2026-09-01' } },
  { asset_tag: 'NST-1060', name: 'iPhone 15 Pro', category: 'Mobile', assigned_to: 'Nora Patel', location: 'London Office', status: 'In use', purchase_date: '2023-10-02', serial: 'IP15-77213', warranty_expiration: '2025-10-02', purchase_value: 890, notes: '', lifecycle_stage: 'Deployed', lifecycle_dates: { Procurement: '2023-10-02', Deployed: '2023-10-06' } },
  { asset_tag: 'NST-1063', name: 'Ford Transit 08', category: 'Vehicles', assigned_to: 'Marcus Lee', location: 'Site 04', status: 'In use', purchase_date: '2020-01-09', serial: 'FT-VIN-4471', warranty_expiration: '2023-01-09', purchase_value: 8200, notes: 'Fleet vehicle, oil change due.', lifecycle_stage: 'Deployed', lifecycle_dates: { Procurement: '2020-01-09', Deployed: '2020-01-15' } },
  { asset_tag: 'NST-1066', name: 'Laser level L-204', category: 'Tools', assigned_to: 'Field ops', location: 'Warehouse A', status: 'In maintenance', purchase_date: '2022-07-30', serial: 'L204-8821', warranty_expiration: '2024-07-30', purchase_value: 95, notes: 'Battery replacement pending.', lifecycle_stage: 'In Maintenance', lifecycle_dates: { Procurement: '2022-07-30', Deployed: '2022-08-04', 'In Maintenance': '2026-08-28' } },
  { asset_tag: 'NST-1071', name: 'Herman Miller Aeron', category: 'Furniture', assigned_to: 'Theo Grant', location: 'New York HQ', status: 'In use', purchase_date: '2022-09-01', serial: 'AER-88244', warranty_expiration: '2032-09-01', purchase_value: 720, notes: '', lifecycle_stage: 'Deployed', lifecycle_dates: { Procurement: '2022-09-01', Deployed: '2022-09-06' } },
  { asset_tag: 'NST-1004', name: 'ThinkPad X1 Carbon', category: 'Computers', assigned_to: 'Ava Rodriguez', location: 'London Office', status: 'Retired', purchase_date: '2019-04-02', serial: 'TP-X1-40021', warranty_expiration: '2022-04-02', purchase_value: 0, notes: 'Decommissioned, pending recycling.', lifecycle_stage: 'Retired/Disposed', lifecycle_dates: { Procurement: '2019-04-02', Deployed: '2019-04-09', 'In Maintenance': '2025-06-02', 'Retired/Disposed': '2026-08-15' } },
  { asset_tag: 'NST-1075', name: 'Toyota 8FGCU25 Forklift', category: 'Equipment', assigned_to: 'Field ops', location: 'Warehouse A', status: 'In use', purchase_date: '2021-03-03', serial: '8FGCU25-4471', warranty_expiration: '2024-03-03', purchase_value: 4100, notes: 'Primary forklift for pallet staging.', lifecycle_stage: 'Deployed', lifecycle_dates: { Procurement: '2021-03-03', Deployed: '2021-03-10' } },
  // Deliberately incomplete records so data-hygiene queries have real gaps.
  { asset_tag: 'NST-1080', name: 'Anker USB-C Dock', category: 'Displays', assigned_to: 'Unassigned', location: '', status: 'Available', purchase_date: null, serial: '', warranty_expiration: null, purchase_value: null, notes: '', lifecycle_stage: 'Procurement', lifecycle_dates: {} },
  { asset_tag: 'NST-1081', name: 'Logitech MX Master 3S', category: 'Equipment', assigned_to: 'Unassigned', location: 'New York HQ', status: 'Available', purchase_date: null, serial: '', warranty_expiration: null, purchase_value: null, notes: '', lifecycle_stage: 'Procurement', lifecycle_dates: {} },
  { asset_tag: 'NST-1082', name: 'Bosch GLL 3-80 Level', category: 'Tools', assigned_to: 'Field ops', location: 'Warehouse A', status: 'In use', purchase_date: '2025-05-20', serial: '', warranty_expiration: null, purchase_value: 340, notes: '', lifecycle_stage: 'Deployed', lifecycle_dates: { Procurement: '2025-05-20' } },
]

/** Marks seeded rows so reset and re-runs do not touch unrelated data. */
const SEED_ID = 'demo-workspace-v1'
const SEED_ASSET_TAGS = seedAssets.map((asset) => asset.asset_tag)

function withSeedMetadata(metadata = {}) {
  return { seed: SEED_ID, ...metadata }
}

function currency(value) {
  if (value == null) return '$0'
  return `$${value.toLocaleString('en-US')}`
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

async function resolveOrganization() {
  const query = admin.from('profiles').select('id, email, organization_id, full_name')
  const { data, error } = email ? await query.eq('email', email) : await query

  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error(email ? `No profile found for ${email}` : 'No profiles found — sign up first')
  if (!email && data.length > 1) {
    throw new Error(`Multiple profiles exist — pass an email: ${data.map((p) => p.email).join(', ')}`)
  }

  return data[0]
}

function recordDataFromSeedAsset(asset) {
  return {
    asset_tag: asset.asset_tag,
    name: asset.name,
    category: asset.category,
    assigned_to: asset.assigned_to,
    location: asset.location,
    status: asset.status,
    purchase_date: asset.purchase_date,
    serial: asset.serial,
    warranty_expiration: asset.warranty_expiration,
    depreciation_value: currency(asset.purchase_value),
    purchase_value: asset.purchase_value,
    notes: asset.notes,
    lifecycle_stage: asset.lifecycle_stage,
    lifecycle_dates: asset.lifecycle_dates,
    it_details: null,
    seed: SEED_ID,
  }
}

async function resolveAssetsGroupId(organizationId) {
  const { data, error } = await admin
    .from('groups')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', 'assets')
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id ?? null
}

async function clearDemoData(organizationId) {
  const assetsGroupId = await resolveAssetsGroupId(organizationId)

  if (assetsGroupId) {
    const { data: records, error: recordsError } = await admin
      .from('records')
      .select('id, data')
      .eq('organization_id', organizationId)
      .eq('group_id', assetsGroupId)
    if (recordsError) throw new Error(recordsError.message)

    const demoRecordIds = (records ?? [])
      .filter((row) => {
        const tag = String(row.data?.asset_tag ?? '')
        return SEED_ASSET_TAGS.includes(tag) || row.data?.seed === SEED_ID
      })
      .map((row) => row.id)

    if (demoRecordIds.length) {
      const { error: deleteRecordsError } = await admin.from('records').delete().in('id', demoRecordIds)
      if (deleteRecordsError) throw new Error(deleteRecordsError.message)
      console.log(`Deleted ${demoRecordIds.length} demo record(s) from records`)
    }
  }

  const { error: deleteAssetsError } = await admin
    .from('assets')
    .delete()
    .eq('organization_id', organizationId)
    .in('asset_tag', SEED_ASSET_TAGS)
  if (deleteAssetsError) throw new Error(deleteAssetsError.message)

  const { error: deleteLogError } = await admin
    .from('audit_log')
    .delete()
    .eq('organization_id', organizationId)
    .eq('metadata->>seed', SEED_ID)
  if (deleteLogError) throw new Error(deleteLogError.message)

  console.log('Cleared demo records, legacy assets, and seeded audit log entries for this organization')
}

async function main() {
  const profile = await resolveOrganization()
  const organizationId = profile.organization_id
  console.log(`${reset ? 'Resetting' : 'Seeding'} organization ${organizationId} (${profile.email})`)

  if (reset) {
    assertDevEnvironment()
    await clearDemoData(organizationId)
    console.log('\nDone. Reload /app — your workspace should be empty of demo data.')
    return
  }

  const payload = seedAssets.map((asset) => ({
    organization_id: organizationId,
    asset_tag: asset.asset_tag,
    name: asset.name,
    category: asset.category,
    assigned_to: asset.assigned_to,
    location: asset.location,
    status: asset.status,
    purchase_date: asset.purchase_date,
    serial: asset.serial,
    warranty_expiration: asset.warranty_expiration,
    depreciation_value: currency(asset.purchase_value),
    purchase_value: asset.purchase_value,
    notes: asset.notes,
    lifecycle_stage: asset.lifecycle_stage,
    lifecycle_dates: asset.lifecycle_dates,
    it_details: null,
  }))

  const { data: inserted, error } = await admin
    .from('assets')
    .upsert(payload, { onConflict: 'organization_id,asset_tag' })
    .select('id, asset_tag, name')

  if (error) throw new Error(`seed assets: ${error.message}`)
  console.log(`Upserted ${inserted.length} legacy asset row(s)`)

  const assetsGroupId = await resolveAssetsGroupId(organizationId)
  if (assetsGroupId) {
    const { data: existingRecords, error: existingRecordsError } = await admin
      .from('records')
      .select('id, data')
      .eq('organization_id', organizationId)
      .eq('group_id', assetsGroupId)
    if (existingRecordsError) throw new Error(existingRecordsError.message)

    const staleIds = (existingRecords ?? [])
      .filter((row) => SEED_ASSET_TAGS.includes(String(row.data?.asset_tag ?? '')))
      .map((row) => row.id)
    if (staleIds.length) {
      const { error: deleteStaleError } = await admin.from('records').delete().in('id', staleIds)
      if (deleteStaleError) throw new Error(deleteStaleError.message)
    }

    const recordPayload = inserted.map((row) => {
      const seedAsset = seedAssets.find((asset) => asset.asset_tag === row.asset_tag)
      if (!seedAsset) throw new Error(`Missing seed asset for tag ${row.asset_tag}`)
      return {
        id: row.id,
        group_id: assetsGroupId,
        organization_id: organizationId,
        data: recordDataFromSeedAsset(seedAsset),
        created_by: profile.id,
      }
    })

    const { data: recordRows, error: insertRecordsError } = await admin
      .from('records')
      .insert(recordPayload)
      .select('id')
    if (insertRecordsError) throw new Error(`seed records: ${insertRecordsError.message}`)
    console.log(`Inserted ${recordRows?.length ?? 0} record(s) into the Assets group`)
  } else {
    console.warn('Assets group not found — skipped records seed (legacy assets table only)')
  }

  const byTag = new Map(inserted.map((row) => [row.asset_tag, row]))
  const actorLabel = profile.full_name || profile.email

  // Import history: the bulk of the directory arrived via spreadsheet import.
  const events = inserted.slice(0, 13).map((row, index) => ({
    organization_id: organizationId,
    category: 'import',
    action: 'Imported asset',
    source: 'import',
    actor_id: profile.id,
    actor_label: actorLabel,
    entity_type: 'Asset',
    entity_id: row.id,
    entity_label: `${row.name} (${row.asset_tag})`,
    summary: 'Created from spreadsheet import via GriffinEye column mapping.',
    metadata: withSeedMetadata({ batch: 'initial-import' }),
    created_at: daysAgo(5 + (index % 3)),
  }))

  const manual = [
    {
      category: 'record',
      action: 'Updated status',
      source: 'manual',
      tag: 'NST-1032',
      summary: 'Status changed from In use to In maintenance for sensor calibration.',
      days: 0,
    },
    {
      category: 'record',
      action: 'Reassigned asset',
      source: 'manual',
      tag: 'NST-1047',
      summary: 'Unassigned from Jordan Lee and returned to Austin Depot stock.',
      days: 1,
    },
    {
      category: 'record',
      action: 'Retired asset',
      source: 'manual',
      tag: 'NST-1004',
      summary: 'Marked Retired/Disposed, pending recycling pickup.',
      days: 12,
    },
    {
      category: 'ai',
      action: 'GriffinEye photo extraction',
      source: 'griffineye',
      tag: 'NST-1052',
      summary: 'Extracted manufacturer, model, and serial from a label photo for review.',
      days: 8,
    },
  ].flatMap((entry) => {
    const row = byTag.get(entry.tag)
    if (!row) return []
    return [
      {
        organization_id: organizationId,
        category: entry.category,
        action: entry.action,
        source: entry.source,
        actor_id: entry.source === 'griffineye' ? null : profile.id,
        actor_label: entry.source === 'griffineye' ? 'GriffinEye' : actorLabel,
        entity_type: 'Asset',
        entity_id: row.id,
        entity_label: `${row.name} (${row.asset_tag})`,
        summary: entry.summary,
        metadata: withSeedMetadata(),
        created_at: daysAgo(entry.days),
      },
    ]
  })

  const userEvents = [
    {
      organization_id: organizationId,
      category: 'user',
      action: 'Signed in',
      source: 'manual',
      actor_id: profile.id,
      actor_label: actorLabel,
      entity_type: 'Session',
      entity_id: null,
      entity_label: profile.email,
      summary: 'Signed in from a new browser session.',
      metadata: withSeedMetadata(),
      created_at: daysAgo(0),
    },
    {
      organization_id: organizationId,
      category: 'user',
      action: 'Updated profile',
      source: 'manual',
      actor_id: profile.id,
      actor_label: actorLabel,
      entity_type: 'Profile',
      entity_id: null,
      entity_label: profile.email,
      summary: 'Changed display name.',
      metadata: withSeedMetadata(),
      created_at: daysAgo(3),
    },
  ]

  const { error: deleteSeedLogError } = await admin
    .from('audit_log')
    .delete()
    .eq('organization_id', organizationId)
    .eq('metadata->>seed', SEED_ID)
  if (deleteSeedLogError) throw new Error(deleteSeedLogError.message)

  const { error: logError } = await admin.from('audit_log').insert([...events, ...manual, ...userEvents])
  if (logError) throw new Error(`seed audit log: ${logError.message}`)

  console.log(`Inserted ${events.length + manual.length + userEvents.length} audit log events`)
  console.log('\nDone. Reload /app to see live data.')
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message)
  process.exit(1)
})
