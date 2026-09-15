/**
 * End-to-end check of the GriffinEye assistant: signs in as a real user, then
 * asks questions through the actual /api/griffineye-query route so the whole
 * path runs — OpenAI function calling, live Supabase queries, usage metering,
 * and AI audit logging.
 *
 * Requires the dev server to be running.
 *
 * Run:
 *   node --env-file=.env.local scripts/verify-griffineye-agent.mjs <email> <password> [baseUrl]
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const [email, password, baseUrlArg] = process.argv.slice(2)
const baseUrl = baseUrlArg ?? 'http://localhost:3000'

if (!url || !anonKey || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

if (!email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/verify-griffineye-agent.mjs <email> <password> [baseUrl]')
  process.exit(1)
}

const QUESTIONS = [
  'How many assets are in maintenance?',
  'Who has the most assets assigned?',
  'Which location holds the most value?',
  'Which records are missing a serial number?',
  'What tables and fields do I have?',
  'What changed via import in the last week?',
  'Which assets were added in the last 30 days?',
]

const projectRef = new URL(url).hostname.split('.')[0]
const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({ email, password })
if (signInError || !signIn.session) {
  console.error('Sign in failed:', signInError?.message)
  process.exit(1)
}

// @supabase/ssr reads the session from a `base64-` prefixed, base64url-encoded
// JSON cookie named sb-<project-ref>-auth-token.
const cookieValue = `base64-${Buffer.from(JSON.stringify(signIn.session), 'utf8').toString('base64url')}`
const cookieHeader = `sb-${projectRef}-auth-token=${cookieValue}`

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
  .eq('usage_type', 'griffineye_query')

if (baselineUsageError) {
  console.error('Baseline usage lookup failed:', baselineUsageError.message)
  process.exit(1)
}

console.log(`Asking ${QUESTIONS.length} questions via ${baseUrl}/api/griffineye-query\n`)

let failures = 0
let successfulQuestions = 0

for (const question of QUESTIONS) {
  const startedAt = Date.now()
  process.stdout.write(`Q: ${question}\n`)

  let response
  try {
    response = await fetch(`${baseUrl}/api/griffineye-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ question }),
    })
  } catch (error) {
    console.log(`   ✗ request failed: ${error.message}\n`)
    failures += 1
    continue
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
  const data = await response.json().catch(() => null)

  if (!response.ok || !data || data.error) {
    console.log(`   ✗ ${response.status}: ${data?.error ?? 'no body'} (${elapsed}s)\n`)
    failures += 1
    continue
  }

  console.log(`   A: ${data.answer}`)
  console.log(`   tools: ${JSON.stringify(data.tools)}`)
  if (data.table) {
    console.log(`   table: [${data.table.columns.map((c) => c.header).join(' | ')}] ${data.table.rows.length} row(s)`)
    for (const row of data.table.rows.slice(0, 3)) {
      console.log(`     ${data.table.columns.map((c) => `${c.header}=${row[c.key]}`).join(', ')}`)
    }
  } else {
    console.log('   table: none')
  }
  console.log(`   usage: ${data.usage?.used}/${data.usage?.cap} (${data.billingSource}) · ${elapsed}s\n`)
  successfulQuestions += 1
}

// The dashboard panel reads live observations from its own route.
const insightsResponse = await fetch(`${baseUrl}/api/griffineye-insights`, { headers: { Cookie: cookieHeader } })
const insights = await insightsResponse.json().catch(() => null)

if (!insightsResponse.ok || !insights) {
  console.log(`✗ insights route failed: ${insightsResponse.status}\n`)
  failures += 1
} else {
  console.log('Dashboard observations:')
  for (const observation of insights.observations ?? []) {
    console.log(`  · ${observation.message}`)
    console.log(`      → "${observation.query}"`)
  }
  console.log('Data health:')
  for (const gap of insights.dataHealth ?? []) {
    console.log(`  · ${gap.label}: ${gap.missing}/${gap.total} blank (${gap.percent}%)`)
  }
  console.log('')
}

// Confirm each successful question was metered and logged for this run only.
const { count: afterUsage, error: afterUsageError } = await admin
  .from('ai_usage_log')
  .select('id', { count: 'exact', head: true })
  .eq('organization_id', org)
  .eq('usage_type', 'griffineye_query')

if (afterUsageError) {
  console.error('Post-run usage lookup failed:', afterUsageError.message)
  failures += 1
} else {
  const usageDelta = (afterUsage ?? 0) - (baselineUsage ?? 0)
  console.log(`ai_usage_log griffineye_query delta: +${usageDelta} (baseline ${baselineUsage})`)
  if (usageDelta < successfulQuestions) {
    console.log(
      `   ✗ expected at least ${successfulQuestions} new usage rows, found ${usageDelta}`,
    )
    failures += 1
  }
}

const { data: aiEvents, error: auditError } = await admin
  .from('audit_log')
  .select('entity_label, metadata')
  .eq('organization_id', org)
  .eq('category', 'ai')
  .eq('action', 'GriffinEye query')
  .gte('created_at', runStartedAt)
  .order('created_at', { ascending: false })

if (auditError) {
  console.error('Post-run audit lookup failed:', auditError.message)
  failures += 1
} else {
  console.log(`AI audit events from this run: ${aiEvents?.length ?? 0}`)
  if ((aiEvents?.length ?? 0) < successfulQuestions) {
    console.log(
      `   ✗ expected at least ${successfulQuestions} audit events since ${runStartedAt}, found ${aiEvents?.length ?? 0}`,
    )
    failures += 1
  }
  for (const event of aiEvents ?? []) {
    const calls = event.metadata?.tool_calls ?? []
    console.log(`  ${event.entity_label}`)
    for (const call of calls) {
      console.log(`     ${call.tool}(${JSON.stringify(call.arguments)})`)
    }
  }
}

process.exit(failures > 0 ? 1 : 0)
