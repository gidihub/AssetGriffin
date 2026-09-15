/**
 * Verifies the GriffinEye assistant's data layer:
 *   - the Phase 1 migration is applied
 *   - every tool query stays inside the caller's organization
 *   - AI usage reservation/release works for the new usage types
 *
 * Run: node --env-file=.env.local scripts/verify-griffineye-phase1.mjs
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

let failures = 0

function check(ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${detail}`)
  if (!ok) failures += 1
}

async function assertMigrationApplied() {
  const { error: valueError } = await admin.from('assets').select('purchase_value').limit(1)
  check(!valueError, 'assets.purchase_value exists')

  const { error: logError } = await admin.from('audit_log').select('id, category, source').limit(1)
  check(!logError, 'audit_log table exists')

  const { data: schema, error: schemaError } = await admin.rpc('griffineye_schema_info')
  check(!schemaError && Array.isArray(schema) && schema.length > 0, 'griffineye_schema_info() returns column metadata')

  if (valueError || logError || schemaError) {
    throw new Error('Migration 20260913160000_griffineye_agent_foundation.sql is not applied')
  }
}

async function main() {
  console.log('GriffinEye Phase 1 verification\n')
  await assertMigrationApplied()

  const suffix = randomUUID().slice(0, 8)
  const emailA = `ge-a-${suffix}@example.com`
  const emailB = `ge-b-${suffix}@example.com`
  const password = `Test-${suffix}!`
  const created = []

  try {
    for (const email of [emailA, emailB]) {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (error) throw new Error(`createUser ${email}: ${error.message}`)
      created.push({ userId: data.user.id, email, organizationId: null })
    }

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, email, organization_id')
      .in('email', [emailA, emailB])
    if (profilesError) throw new Error(profilesError.message)

    for (const profile of profiles) {
      const entry = created.find((c) => c.userId === profile.id)
      if (entry) entry.organizationId = profile.organization_id
    }

    const orgA = created.find((c) => c.email === emailA)
    const orgB = created.find((c) => c.email === emailB)

    // Seed distinguishable data in both organizations.
    for (const [org, tag, value] of [
      [orgA, `A-${suffix}`, 1000],
      [orgB, `B-${suffix}`, 9999],
    ]) {
      const { error } = await admin.from('assets').insert({
        organization_id: org.organizationId,
        asset_tag: tag,
        name: `Asset ${tag}`,
        category: 'Computers',
        assigned_to: 'Test Owner',
        location: 'Test Site',
        status: 'In use',
        serial: '',
        purchase_value: value,
      })
      if (error) throw new Error(`seed ${tag}: ${error.message}`)

      const { error: logInsertError } = await admin.from('audit_log').insert({
        organization_id: org.organizationId,
        category: 'record',
        action: 'Created asset',
        source: 'import',
        actor_label: 'Verification script',
        entity_type: 'Asset',
        entity_label: tag,
        summary: `Seeded ${tag}`,
      })
      if (logInsertError) throw new Error(`seed log ${tag}: ${logInsertError.message}`)
    }

    // Sign in as org A and exercise the tool query surface.
    const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: session, error: signInError } = await anon.auth.signInWithPassword({
      email: emailA,
      password,
    })
    if (signInError || !session.session) throw new Error(signInError?.message ?? 'sign in failed')

    const authed = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // count_assets
    const { count, error: countError } = await authed
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgA.organizationId)
    check(!countError && count === 1, `count_assets sees only org A (${count} row)`)

    // search_assets — cross-org isolation
    const { data: allVisible, error: searchError } = await authed.from('assets').select('asset_tag, purchase_value')
    const leaked = (allVisible ?? []).filter((row) => row.asset_tag === `B-${suffix}`)
    check(!searchError && leaked.length === 0, 'search_assets cannot see the other organization')

    // Explicitly asking for org B returns nothing, even though the filter is attacker-controlled.
    const { data: forced, error: forcedError } = await authed
      .from('assets')
      .select('asset_tag')
      .eq('organization_id', orgB.organizationId)
    check(!forcedError && (forced ?? []).length === 0, 'forcing organization_id to another org returns no rows')

    // rank_by input — grouping columns readable, scoped
    const { data: rankRows, error: rankError } = await authed
      .from('assets')
      .select('assigned_to, purchase_value')
      .eq('organization_id', orgA.organizationId)
    check(!rankError && rankRows.length === 1 && Number(rankRows[0].purchase_value) === 1000, 'rank_by reads numeric purchase_value')

    // assets_by_recency
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recent, error: recentError } = await authed
      .from('assets')
      .select('asset_tag')
      .eq('organization_id', orgA.organizationId)
      .gte('created_at', cutoff)
    check(!recentError && recent.length === 1, 'assets_by_recency filters on created_at')

    // get_change_history
    const { data: history, error: historyError } = await authed
      .from('audit_log')
      .select('entity_label, source')
      .eq('organization_id', orgA.organizationId)
    check(!historyError && history.length === 1 && history[0].source === 'import', 'get_change_history reads own org audit log')

    const { data: foreignHistory, error: foreignHistoryError } = await authed.from('audit_log').select('entity_label')
    const leakedHistory = (foreignHistory ?? []).filter((row) => row.entity_label === `B-${suffix}`)
    check(!foreignHistoryError && leakedHistory.length === 0, 'audit log does not leak across organizations')

    // Append-only: members must not be able to rewrite history.
    const { error: tamperError } = await authed
      .from('audit_log')
      .update({ summary: 'tampered' })
      .eq('organization_id', orgA.organizationId)
    const { data: afterTamper, error: afterTamperError } = await authed
      .from('audit_log')
      .select('summary')
      .eq('organization_id', orgA.organizationId)
    const unchanged = (afterTamper ?? []).every((row) => row.summary !== 'tampered')
    check(Boolean(tamperError) || (!afterTamperError && unchanged), 'audit log is append-only for members')

    // get_schema_info
    const { data: schemaInfo, error: schemaInfoError } = await authed.rpc('griffineye_schema_info')
    const hasAssetFields = (schemaInfo ?? []).some(
      (row) => row.table_name === 'assets (record fields)' && row.column_name === 'serial',
    )
    check(!schemaInfoError && hasAssetFields, 'get_schema_info introspects assets group field definitions')

    // Usage metering for the new query type.
    const { data: reservation, error: reserveError } = await authed.rpc('reserve_griffineye_usage', {
      p_organization_id: orgA.organizationId,
      p_usage_type: 'griffineye_query',
    })
    const reserved = Array.isArray(reservation) ? reservation[0] : reservation
    check(
      !reserveError && reserved?.usage_log_id,
      reserveError
        ? `reserve_griffineye_usage('griffineye_query') failed: ${reserveError.message}`
        : `reserve_griffineye_usage('griffineye_query') works (${reserved?.billing_source})`,
    )

    const { count: usageCount } = await authed
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgA.organizationId)
    check(usageCount === 1, 'query billed against the shared monthly allowance')

    // Cross-org reservation must be rejected.
    const { error: crossReserveError } = await authed.rpc('reserve_griffineye_usage', {
      p_organization_id: orgB.organizationId,
      p_usage_type: 'griffineye_query',
    })
    check(Boolean(crossReserveError), 'reserving usage against another org is rejected')

    if (reserved?.usage_log_id) {
      const { error: releaseError } = await authed.rpc('release_griffin_vision_usage', {
        p_usage_log_id: reserved.usage_log_id,
      })
      const { count: afterRelease } = await authed
        .from('ai_usage_log')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgA.organizationId)
      check(!releaseError && afterRelease === 0, 'failed queries release the reserved credit')
    }

    console.log(failures === 0 ? '\nAll Phase 1 data-layer checks passed.' : `\n${failures} check(s) failed.`)
  } finally {
    for (const { userId, organizationId } of created) {
      await admin.auth.admin.deleteUser(userId)
      if (organizationId) await admin.from('organizations').delete().eq('id', organizationId)
    }
  }

  if (failures > 0) process.exit(1)
}

main().catch((error) => {
  console.error('\nVerification failed:', error.message)
  process.exit(1)
})
