/**
 * Removes org-scoped test/draft records left by verify scripts or intake experiments.
 *
 * Defaults to dry-run. Deletion requires --execute and CLEANUP_ORGANIZATION_ID.
 *
 * Run:
 *   node --env-file=.env.local scripts/cleanup-stale-records.mjs
 *   node --env-file=.env.local scripts/cleanup-stale-records.mjs --execute
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const organizationId = process.env.CLEANUP_ORGANIZATION_ID
const minAgeDays = Number(process.env.CLEANUP_MIN_AGE_DAYS ?? 7)
const execute = process.argv.includes('--execute')

/** Dedicated markers for automated test/draft rows — never global prefix scans. */
const TEST_TAG_PREFIXES = ['__test__', 'RLS-', 'SEC-', 'AG-']
const DRAFT_PREFIX = 'DRAFT-'

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!organizationId) {
  console.error('Set CLEANUP_ORGANIZATION_ID to the workspace org you want to clean.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

function isStaleTestTag(assetTag) {
  if (typeof assetTag !== 'string' || !assetTag) return false
  if (assetTag.startsWith(DRAFT_PREFIX)) return true
  return TEST_TAG_PREFIXES.some((prefix) => assetTag.startsWith(prefix))
}

async function main() {
  const cutoff = new Date(Date.now() - minAgeDays * 86_400_000).toISOString()

  const { data: rows, error: findError } = await admin
    .from('records')
    .select('id, data, created_at')
    .eq('organization_id', organizationId)
    .lt('created_at', cutoff)

  if (findError) throw findError

  const targets = (rows ?? []).filter((row) => isStaleTestTag(row.data?.asset_tag))

  if (!targets.length) {
    console.log(`No stale test/draft records found for org ${organizationId}.`)
    return
  }

  console.log(
    `${execute ? 'Deleting' : 'Dry run — would delete'} ${targets.length} record(s) for org ${organizationId} (older than ${minAgeDays} day(s)):`,
  )
  for (const row of targets) {
    console.log(` - ${row.id} ${row.data?.asset_tag ?? ''} ${row.data?.name ?? ''} (${row.created_at})`)
  }

  if (!execute) {
    console.log('\nRe-run with --execute to delete these rows.')
    return
  }

  const { error: deleteError } = await admin.from('records').delete().in('id', targets.map((row) => row.id))
  if (deleteError) throw deleteError

  console.log('Cleanup complete.')
}

main().catch((error) => {
  console.error('Cleanup failed:', error.message)
  process.exit(1)
})
