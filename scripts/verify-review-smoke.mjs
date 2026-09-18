#!/usr/bin/env node
/**
 * Smoke tests after review_fixes migration.
 * Run: node --env-file=.env.local scripts/verify-review-smoke.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:3005'

if (!url || !serviceKey || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

let failures = 0

function check(ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${detail}`)
  if (!ok) failures += 1
}

async function authedClient(email, password) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(error?.message ?? 'sign in failed')
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function createOrgWithUsers() {
  const suffix = randomUUID().slice(0, 8)
  const adminEmail = `smoke-admin-${suffix}@example.com`
  const memberEmail = `smoke-member-${suffix}@example.com`
  const password = `Smoke-${suffix}!`

  const { data: adminUser, error: adminError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
  })
  if (adminError) throw new Error(adminError.message)

  const { data: adminProfile, error: profileError } = await admin
    .from('profiles')
    .select('id, organization_id, role')
    .eq('id', adminUser.user.id)
    .single()
  if (profileError) throw new Error(profileError.message)

  const orgId = adminProfile.organization_id

  const { data: memberUser, error: memberError } = await admin.auth.admin.createUser({
    email: memberEmail,
    password,
    email_confirm: true,
  })
  if (memberError) throw new Error(memberError.message)

  const { data: autoMemberProfile, error: autoMemberProfileError } = await admin
    .from('profiles')
    .select('organization_id')
    .eq('id', memberUser.user.id)
    .single()
  if (autoMemberProfileError) throw new Error(autoMemberProfileError.message)

  const strayOrgId = autoMemberProfile.organization_id
  const { error: deleteProfileError } = await admin.from('profiles').delete().eq('id', memberUser.user.id)
  if (deleteProfileError) throw new Error(deleteProfileError.message)

  const { error: deleteStrayOrgError } = await admin.from('organizations').delete().eq('id', strayOrgId)
  if (deleteStrayOrgError) throw new Error(deleteStrayOrgError.message)

  const { data: memberProfile, error: memberProfileError } = await admin
    .from('profiles')
    .insert({
      id: memberUser.user.id,
      organization_id: orgId,
      email: memberEmail,
      role: 'member',
    })
    .select('organization_id, role')
    .single()
  if (memberProfileError) throw new Error(memberProfileError.message)
  if (memberProfile.organization_id !== orgId || memberProfile.role !== 'member') {
    throw new Error('Member profile setup did not persist expected organization_id and role')
  }

  return {
    suffix,
    password,
    orgId,
    adminEmail,
    memberEmail,
    adminUserId: adminUser.user.id,
    memberUserId: memberUser.user.id,
  }
}

async function cleanup(ctx) {
  const { error: memberDeleteError } = await admin.auth.admin.deleteUser(ctx.memberUserId)
  if (memberDeleteError) {
    console.warn(`cleanup: failed to delete member user: ${memberDeleteError.message}`)
  }

  const { error: adminDeleteError } = await admin.auth.admin.deleteUser(ctx.adminUserId)
  if (adminDeleteError) {
    console.warn(`cleanup: failed to delete admin user: ${adminDeleteError.message}`)
  }

  const { error: orgDeleteError } = await admin.from('organizations').delete().eq('id', ctx.orgId)
  if (orgDeleteError) {
    console.warn(`cleanup: failed to delete organization: ${orgDeleteError.message}`)
  }
}

function sessionCookie(session) {
  const projectRef = new URL(url).hostname.split('.')[0]
  return `sb-${projectRef}-auth-token=base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`
}

async function testFieldRenameById(ctx) {
  console.log('\n1. Field settings — rename key preserves field ID')

  const adminClient = await authedClient(ctx.adminEmail, ctx.password)
  const { data: group, error: groupError } = await adminClient
    .from('groups')
    .select('id')
    .eq('slug', 'assets')
    .single()
  if (groupError) throw new Error(groupError.message)

  const { data: fields, error: fieldsError } = await adminClient
    .from('fields')
    .select('id, key, label, type, options, sort_order, required')
    .eq('group_id', group.id)
    .order('sort_order')
  if (fieldsError) throw new Error(fieldsError.message)

  const target = fields.find((field) => field.key === 'notes')
  check(Boolean(target?.id), 'assets group has a notes field with an id')

  const renamedKey = `notes_renamed_${ctx.suffix}`
  const payload = fields.map((field) =>
    field.id === target.id
      ? {
          id: field.id,
          key: renamedKey,
          label: field.label,
          type: field.type,
          options: field.options ?? {},
          sort_order: field.sort_order,
          required: field.required,
        }
      : {
          id: field.id,
          key: field.key,
          label: field.label,
          type: field.type,
          options: field.options ?? {},
          sort_order: field.sort_order,
          required: field.required,
        },
  )

  const { error: replaceError } = await adminClient.rpc('replace_group_fields_atomic', {
    p_group_id: group.id,
    p_fields: payload,
  })
  check(!replaceError, `replace_group_fields_atomic succeeds (${replaceError?.message ?? 'ok'})`)

  const { data: after, error: afterError } = await adminClient
    .from('fields')
    .select('id, key')
    .eq('id', target.id)
    .single()
  if (afterError) throw new Error(afterError.message)

  check(after.id === target.id, 'field row id unchanged after key rename')
  check(after.key === renamedKey, 'field key updated to renamed value')

  const restorePayload = payload.map((field) =>
    field.id === target.id ? { ...field, key: 'notes' } : field,
  )
  await adminClient.rpc('replace_group_fields_atomic', {
    p_group_id: group.id,
    p_fields: restorePayload,
  })
}

async function testBrandingPolicies(ctx) {
  console.log('\n2. Branding — admin can upload, member cannot')

  const adminClient = await authedClient(ctx.adminEmail, ctx.password)
  const memberClient = await authedClient(ctx.memberEmail, ctx.password)

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  const path = `${ctx.orgId}/smoke-logo-${ctx.suffix}.png`

  const { error: memberUploadError } = await memberClient.storage.from('org-branding').upload(path, png, {
    contentType: 'image/png',
    upsert: true,
  })
  check(Boolean(memberUploadError), `member upload blocked (${memberUploadError?.message ?? 'unexpected success'})`)

  const { error: adminUploadError } = await adminClient.storage.from('org-branding').upload(path, png, {
    contentType: 'image/png',
    upsert: true,
  })
  check(!adminUploadError, `admin upload succeeds (${adminUploadError?.message ?? 'ok'})`)

  await admin.storage.from('org-branding').remove([path])
}

async function testImportValidation(ctx) {
  console.log('\n3. Import — validation errors and successful import')

  const signInClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: signIn, error: signInError } = await signInClient.auth.signInWithPassword({
    email: ctx.adminEmail,
    password: ctx.password,
  })
  if (signInError || !signIn.session) throw new Error(signInError?.message ?? 'sign in failed')

  const headers = {
    'Content-Type': 'application/json',
    Cookie: sessionCookie(signIn.session),
  }

  const invalidRes = await fetch(`${baseUrl}/api/assets/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      records: [{ asset_tag: 'SMOKE-1', name: 'Valid' }, { asset_tag: 'SMOKE-2' }],
    }),
  })
  const invalidBody = await invalidRes.json()
  check(invalidRes.status === 400, `invalid asset import returns 400 (got ${invalidRes.status})`)
  check(Array.isArray(invalidBody.validationErrors), 'invalid asset import includes validationErrors')
  check(
    invalidBody.validationErrors.some((entry) => entry.index === 1),
    'invalid asset import references failing row index',
  )

  const tag = `SMOKE-${ctx.suffix}`
  const validRes = await fetch(`${baseUrl}/api/assets/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      records: [
        {
          asset_tag: tag,
          name: 'Smoke test asset',
          category: 'Equipment',
          assigned_to: 'Unassigned',
          location: '',
          status: 'Available',
          purchase_date: null,
          serial: '',
          warranty_expiration: null,
          depreciation_value: '$0',
          notes: '',
          lifecycle_stage: 'Procurement',
        },
      ],
    }),
  })
  const validBody = await validRes.json()
  check(validRes.status === 200, `valid asset import returns 200 (got ${validRes.status})`)
  check(validBody.imported === 1, `valid asset import reports imported=1 (got ${validBody.imported})`)

  const peopleInvalidRes = await fetch(`${baseUrl}/api/groups/people/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      records: [{ name: 'Valid Person' }, { email: 'no-name@example.com' }],
    }),
  })
  const peopleInvalidBody = await peopleInvalidRes.json()
  check(peopleInvalidRes.status === 400, `invalid people import returns 400 (got ${peopleInvalidRes.status})`)
  check(Array.isArray(peopleInvalidBody.validationErrors), 'invalid people import includes validationErrors')
}

async function testOverageLockAndReservation(ctx) {
  console.log('\n4. GriffinEye overage — lock RPCs and usage reservation')

  const { data: leaseToken, error: lockError } = await admin.rpc('acquire_griffineye_overage_billing_lock', {
    p_org_id: ctx.orgId,
  })
  check(!lockError && typeof leaseToken === 'string' && leaseToken.length > 0, `acquire_griffineye_overage_billing_lock returns lease token (${lockError?.message ?? leaseToken})`)
  const { data: released, error: releaseError } = await admin.rpc('release_griffineye_overage_billing_lock', {
    p_org_id: ctx.orgId,
    p_lease_token: leaseToken,
  })
  check(!releaseError && released === true, `release_griffineye_overage_billing_lock succeeds (${releaseError?.message ?? released})`)

  await admin.from('organizations').update({ subscription_tier: 'growth' }).eq('id', ctx.orgId)

  const adminClient = await authedClient(ctx.adminEmail, ctx.password)
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()

  const seedRows = Array.from({ length: 500 }, () => ({
    organization_id: ctx.orgId,
    usage_type: 'griffineye_query',
    billing_source: 'tier_allowance',
    created_at: monthStart,
  }))
  const { error: seedError } = await admin.from('ai_usage_log').insert(seedRows)
  check(!seedError, `seed growth allowance usage (${seedError?.message ?? 'ok'})`)

  const { data, error } = await adminClient.rpc('reserve_griffineye_usage', {
    p_organization_id: ctx.orgId,
    p_usage_type: 'griffineye_query',
  })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  const lastBillingSource = row?.billing_source ?? null

  check(lastBillingSource === 'overage', `growth tier bills next scan as overage (got ${lastBillingSource})`)

  const { count, error: countError } = await admin
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ctx.orgId)
    .eq('billing_source', 'overage')
  if (countError) throw new Error(countError.message)
  check((count ?? 0) > 0, 'ai_usage_log contains overage rows')
}

async function main() {
  console.log('Review fixes smoke tests\n')

  try {
    const health = await fetch(`${baseUrl}/login`)
    check(health.ok || health.status === 200 || health.status === 307, `app reachable at ${baseUrl}`)
  } catch (error) {
    check(false, `app reachable at ${baseUrl} (${error instanceof Error ? error.message : 'failed'})`)
    console.error('\nStart the dev server: pnpm dev')
    process.exit(1)
  }

  const ctx = await createOrgWithUsers()
  try {
    await testFieldRenameById(ctx)
    await testBrandingPolicies(ctx)
    await testImportValidation(ctx)
    await testOverageLockAndReservation(ctx)
  } finally {
    await cleanup(ctx)
  }

  console.log(`\n${failures ? `FAILED (${failures} check(s))` : 'All smoke tests passed.'}`)
  process.exit(failures ? 1 : 0)
}

main().catch((error) => {
  console.error('\nSmoke test crashed:', error.message)
  process.exit(1)
})
