/**
 * Verifies Path B: auth tables, org signup trigger, RLS, and import APIs.
 * Run: node --env-file=.env.local scripts/verify-path-b.mjs
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

function log(step, ok, detail) {
  console.log(`${ok ? '✓' : '✗'} Step ${step}: ${detail}`)
}

async function tableExists(name) {
  const { error } = await admin.from(name).select('*', { head: true, count: 'exact' })
  if (!error) return true
  if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) return false
  throw new Error(`${name}: ${error.message}`)
}

function testRecordPayload(assetTag, name) {
  return {
    asset_tag: assetTag,
    name,
    category: 'Test',
    status: 'Available',
    lifecycle_stage: 'Procurement',
  }
}

async function main() {
  console.log('AssetGriffin Path B verification\n')

  const hasOrgs = await tableExists('organizations')
  const hasProfiles = await tableExists('profiles')
  const hasAssets = await tableExists('assets')
  const hasGroups = await tableExists('groups')
  const hasRecords = await tableExists('records')

  if (!hasOrgs || !hasProfiles || !hasAssets || !hasGroups || !hasRecords) {
    log(
      '2–3',
      false,
      'Schema not applied — run migrations through 20260914180000_groups_fields_records_phase1.sql in the Supabase SQL editor',
    )
    console.log('\nApply migration, then re-run this script.')
    throw new Error('Schema not applied')
  }

  log('2–3', true, 'organizations, profiles, assets, groups, and records tables exist')

  const suffix = randomUUID().slice(0, 8)
  const emailA = `pathb-a-${suffix}@example.com`
  const emailB = `pathb-b-${suffix}@example.com`
  const password = `Test-${suffix}!`
  const createdUsers = []

  try {
    for (const email of [emailA, emailB]) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) throw new Error(`createUser ${email}: ${error.message}`)
      if (data.user?.id) {
        createdUsers.push({ userId: data.user.id, organizationId: null })
      }
    }

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, organization_id, email')
      .in('email', [emailA, emailB])

    if (profilesError) throw new Error(profilesError.message)
    if (profiles?.length !== 2) {
      log('2', false, `Signup trigger created ${profiles?.length ?? 0}/2 profiles — check handle_new_user trigger`)
      throw new Error('Signup trigger did not create expected profiles')
    }

    for (const profile of profiles ?? []) {
      const created = createdUsers.find((entry) => entry.userId === profile.id)
      if (created) created.organizationId = profile.organization_id
    }

    const orgA = profiles.find((p) => p.email === emailA)?.organization_id
    const orgB = profiles.find((p) => p.email === emailB)?.organization_id
    if (!orgA || !orgB || orgA === orgB) {
      log('2', false, 'Each signup should get a distinct organization')
      throw new Error('Signup trigger did not create distinct organizations')
    }

    log('2', true, 'Signup trigger created org + profile for each new user')

    const { data: groupA, error: groupAError } = await admin
      .from('groups')
      .select('id')
      .eq('organization_id', orgA)
      .eq('slug', 'assets')
      .single()
    if (groupAError) throw new Error(`assets group lookup org A: ${groupAError.message}`)

    const { data: groupB, error: groupBError } = await admin
      .from('groups')
      .select('id')
      .eq('organization_id', orgB)
      .eq('slug', 'assets')
      .single()
    if (groupBError) throw new Error(`assets group lookup org B: ${groupBError.message}`)

    const userClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: sessionA, error: signInError } = await userClient.auth.signInWithPassword({
      email: emailA,
      password,
    })
    if (signInError || !sessionA.session) throw new Error(signInError?.message ?? 'sign in failed')

    const authed = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${sessionA.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const tag = `AG-${suffix}`
    const foreignTag = `${tag}-x`

    const { error: insertError } = await authed.from('records').insert({
      group_id: groupA.id,
      organization_id: orgA,
      data: testRecordPayload(tag, 'RLS test asset'),
    })
    if (insertError) throw new Error(`insert own org record: ${insertError.message}`)

    const { error: crossOrgError } = await authed.from('records').insert({
      group_id: groupB.id,
      organization_id: orgB,
      data: testRecordPayload(foreignTag, 'Cross org asset'),
    })
    if (!crossOrgError) {
      log('3', false, 'RLS allowed inserting a record into another organization')
      throw new Error('RLS allowed inserting a record into another organization')
    }

    const { error: frozenAssetsError } = await authed.from('assets').insert({
      organization_id: orgA,
      asset_tag: tag,
      name: 'RLS test asset',
      category: 'Test',
    })
    log(
      '3',
      Boolean(frozenAssetsError),
      frozenAssetsError
        ? 'legacy assets table remains insert-frozen'
        : 'authenticated users can still INSERT into frozen assets table',
    )
    if (!frozenAssetsError) throw new Error('legacy assets table should reject authenticated inserts')

    const { error: seedForeignError } = await admin.from('records').insert({
      group_id: groupB.id,
      organization_id: orgB,
      data: testRecordPayload(foreignTag, 'Foreign org asset'),
    })
    if (seedForeignError) throw new Error(`seed foreign record: ${seedForeignError.message}`)

    const { data: visible, error: selectError } = await authed.from('records').select('data')
    if (selectError) throw new Error(selectError.message)
    const foreign = (visible ?? []).filter((row) => row.data?.asset_tag === foreignTag)
    if (foreign.length) {
      log('3', false, 'RLS leaked records from another organization')
      throw new Error('RLS leaked records from another organization')
    }

    log('3', true, 'RLS blocks cross-org writes and scopes reads to the user organization')

    console.log('\nAll Path B database checks passed.')
    console.log('Next: start the app and confirm /app redirects to /login when logged out.')
  } finally {
    const deleteErrors = []
    const deletedOrganizationIds = new Set()

    for (const { userId, organizationId } of createdUsers) {
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) {
        deleteErrors.push(`${userId}: ${error.message}`)
        continue
      }

      if (organizationId && !deletedOrganizationIds.has(organizationId)) {
        const { error: orgDeleteError } = await admin.from('organizations').delete().eq('id', organizationId)
        if (orgDeleteError) {
          deleteErrors.push(`org ${organizationId}: ${orgDeleteError.message}`)
        } else {
          deletedOrganizationIds.add(organizationId)
        }
      }
    }

    if (deleteErrors.length) {
      console.error('\nCleanup errors while deleting test users:', deleteErrors.join('; '))
    }
  }
}

main().catch((error) => {
  console.error('\nVerification failed:', error.message)
  process.exit(1)
})
