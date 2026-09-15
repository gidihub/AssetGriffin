/**
 * End-to-end check of GriffinEye report generation: asks for CSV and PDF exports
 * through the real assistant route, then validates the returned files by parsing
 * them — a plausible-looking answer with a corrupt attachment should fail here.
 *
 * Files are written to /tmp so they can be opened by hand.
 *
 * Run:
 *   node --env-file=.env.local scripts/verify-griffineye-reports.mjs <email> <password> [baseUrl]
 */
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument } from 'pdf-lib'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const [email, password, baseUrlArg] = process.argv.slice(2)
const baseUrl = baseUrlArg ?? 'http://localhost:3000'

if (!url || !anonKey || !email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/verify-griffineye-reports.mjs <email> <password> [baseUrl]')
  process.exit(1)
}

const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
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

const ask = (question) =>
  fetch(`${baseUrl}/api/griffineye-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ question }),
  })

let failures = 0
const fail = (message) => {
  console.log(`   ✗ ${message}`)
  failures += 1
}

const CASES = [
  { question: 'Export the assets missing a serial number as a CSV', expectFormat: 'csv' },
  { question: 'Give me a PDF summary of every asset currently in maintenance', expectFormat: 'pdf' },
]

for (const { question, expectFormat } of CASES) {
  console.log(`"${question}"`)
  const response = await ask(question)
  const data = await response.json().catch(() => null)

  if (!response.ok || !data) {
    fail(`${response.status}: ${data?.error ?? 'no body'}`)
    console.log('')
    continue
  }

  console.log(`   answer: ${data.answer}`)
  console.log(`   tools: [${(data.tools ?? []).join(', ')}]`)

  if (!data.report) {
    fail('no report was attached to the response')
    console.log('')
    continue
  }

  const report = data.report
  const bytes = Buffer.from(report.base64, 'base64')
  const path = join(tmpdir(), report.filename)
  writeFileSync(path, bytes)

  console.log(
    `   file: ${report.filename} · ${report.format} · ${report.rowCount} rows × ${report.columnCount} cols · ${bytes.byteLength} B`,
  )
  console.log(`   saved to ${path}`)

  if (report.format !== expectFormat) fail(`expected a ${expectFormat}, got ${report.format}`)
  if (report.rowCount === 0) fail('report has no rows')
  if (bytes.byteLength !== report.byteSize) fail('byteSize does not match the payload')

  if (report.format === 'csv') {
    if (report.mimeType !== 'text/csv') fail(`unexpected mime type ${report.mimeType}`)
    const lines = bytes.toString('utf8').split('\r\n')
    const headerCells = lines[0].split(',').length
    console.log(`   csv: ${lines.length} lines, header "${lines[0]}"`)

    if (lines.length !== report.rowCount + 1) {
      fail(`expected ${report.rowCount + 1} lines (header + rows), got ${lines.length}`)
    }
    if (headerCells !== report.columnCount) {
      fail(`header has ${headerCells} cells but report claims ${report.columnCount} columns`)
    }
    // Quoting must survive round-tripping, and formulas must stay inert.
    const dangerous = lines.slice(1).find((line) => /^[=+@]/.test(line))
    if (dangerous) fail(`a cell begins with a formula character: ${dangerous.slice(0, 40)}`)
  } else {
    if (report.mimeType !== 'application/pdf') fail(`unexpected mime type ${report.mimeType}`)
    if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') fail('file is not a PDF')

    try {
      const pdf = await PDFDocument.load(bytes)
      const pages = pdf.getPages()
      console.log(`   pdf: ${pages.length} page(s), title "${pdf.getTitle() ?? ''}"`)
      if (pages.length === 0) fail('PDF has no pages')
      if (!pdf.getTitle()) fail('PDF has no title metadata')
    } catch (error) {
      fail(`PDF could not be parsed: ${error.message}`)
    }
  }

  console.log('')
}

// A plain "export everything" should point at the existing UI export instead of
// spending a generation on a file the Assets page already produces.
console.log('"Export all of my assets"')
const plainResponse = await ask('Export all of my assets')
const plainData = await plainResponse.json().catch(() => null)
console.log(`   answer: ${plainData?.answer ?? `error ${plainResponse.status}`}`)
console.log(`   generated a file: ${plainData?.report ? 'yes' : 'no'}`)
const mentionsExport = /export button|assets page|export/i.test(plainData?.answer ?? '')
console.log(`   points at the built-in export: ${mentionsExport ? 'yes' : 'no'}`)
if (!mentionsExport) console.log('   (informational — prompt guidance, not a hard requirement)')

console.log(failures > 0 ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures > 0 ? 1 : 0)
