import type { SpreadsheetTable } from '@/lib/griffineye-import'
import { parseCsv } from '@/lib/griffineye-import'
import { getOpenAIClient, GRIFFINEYE_AI_MODEL } from '@/lib/openai'
import { normalizeDateValue } from '@/lib/records-parity'

export type PeopleStatus = 'Active' | 'Invited' | 'Overdue'

export type ImportPeopleRecord = {
  name: string
  team: string
  role: string
  department: string
  email: string
  phone: string
  status: PeopleStatus
  last_check_out: string | null
  employee_id: string
  title: string
  site: string
  location: string
  notes: string
}

export type PeopleColumnMapping = {
  source: string
  target: PeopleMappingTarget | null
}

export type GriffinPeopleImportExtraction = {
  summary: string
  columnMappings: PeopleColumnMapping[]
  records: ImportPeopleRecord[]
  warnings: string[]
  rowCount: number
  duplicatesSkipped: number
}

type StoredPeopleField = keyof ImportPeopleRecord
type PeopleMappingTarget = StoredPeopleField | 'first_name' | 'last_name'

const STORED_FIELDS: StoredPeopleField[] = [
  'name',
  'team',
  'role',
  'department',
  'email',
  'phone',
  'status',
  'last_check_out',
  'employee_id',
  'title',
  'site',
  'location',
  'notes',
]

const MAPPING_TARGETS: PeopleMappingTarget[] = [...STORED_FIELDS, 'first_name', 'last_name']

const SYSTEM_PROMPT = `You map spreadsheet columns to AssetGriffin People & teams import fields.

Return JSON only:
{
  "summary": "Short summary of what GriffinEye mapped",
  "columnMappings": [{ "source": "exact header from spreadsheet", "target": "name|email|..."|null }],
  "warnings": ["optional warnings"]
}

Valid targets: ${MAPPING_TARGETS.join(', ')}

Map only columns you are confident about. Use null when unsure. Do not invent data — mapping only.

When the export has separate first/last name columns (e.g. "First Name", "Given Name", "Last Name", "Surname"), map them to first_name and last_name instead of name.

IGNORE these HR-specific columns — map them to null, do not try to fit them into our fields:
bio, biography, tags, marital status, gender, ethnicity, date of birth, birthday, age,
reporting manager, manager email, reports to, org chart, onboarding status, onboarding checklist,
benefits, payroll, bank account, tax, SSN, social security, emergency contact, dependents,
visa, work authorization, performance review, PTO balance, leave balance, compensation,
salary, bonus, equity, stock options, custom field metadata, internal ids unrelated to employee_id.

Real HR exports (Zoho People, BambooHR, Gusto, Rippling, etc.) often have 30+ columns. Map the handful that match our directory fields and ignore the rest.`

export function normalizePeopleStatus(value: string): PeopleStatus {
  const text = value.toLowerCase().trim()
  if (!text) return 'Active'

  if (
    text.includes('invite') ||
    text.includes('pending') ||
    text.includes('onboard') ||
    text.includes('not started') ||
    text.includes('awaiting')
  ) {
    return 'Invited'
  }

  if (text.includes('overdue') || text.includes('past due') || text.includes('late return')) {
    return 'Overdue'
  }

  if (
    text.includes('active') ||
    text.includes('employ') ||
    text.includes('current') ||
    text.includes('full-time') ||
    text.includes('full time') ||
    text.includes('part-time') ||
    text.includes('part time') ||
    text.includes('working')
  ) {
    return 'Active'
  }

  // Terminated / on leave / inactive — still import as directory rows; custody status defaults Active.
  return 'Active'
}

function normalizeImportDate(value: string): string | null {
  return normalizeDateValue(value.trim() || null)
}

function dedupePeopleRecords(records: ImportPeopleRecord[]): {
  records: ImportPeopleRecord[]
  duplicatesSkipped: number
} {
  const seen = new Set<string>()
  const deduped: ImportPeopleRecord[] = []
  let duplicatesSkipped = 0

  for (const record of records) {
    const employeeId = record.employee_id.trim()
    const email = record.email.trim().toLowerCase()
    const key = employeeId
      ? `id:${employeeId.toLowerCase()}`
      : email
        ? `email:${email}`
        : null

    if (key) {
      if (seen.has(key)) {
        duplicatesSkipped += 1
        continue
      }
      seen.add(key)
    }

    deduped.push(record)
  }

  return { records: deduped, duplicatesSkipped }
}

function applyMappings(
  headers: string[],
  rows: string[][],
  mappings: PeopleColumnMapping[],
): ImportPeopleRecord[] {
  const indexByHeader = new Map(headers.map((header, index) => [header, index]))
  const mappingByTarget = new Map<PeopleMappingTarget, string>()

  for (const mapping of mappings) {
    if (!mapping || typeof mapping !== 'object') continue
    const target = (mapping as PeopleColumnMapping).target
    const source = (mapping as PeopleColumnMapping).source
    if (typeof target !== 'string' || !target || typeof source !== 'string' || !source.trim()) continue
    mappingByTarget.set(target, source)
  }

  function valueFor(target: PeopleMappingTarget, row: string[], fallback = ''): string {
    const source = mappingByTarget.get(target)
    if (!source) return fallback
    const index = indexByHeader.get(source)
    if (index === undefined) return fallback
    return row[index]?.trim() ?? fallback
  }

  return rows
    .map((row) => {
      let name = valueFor('name', row)
      const firstName = valueFor('first_name', row)
      const lastName = valueFor('last_name', row)
      if (!name && (firstName || lastName)) {
        name = [firstName, lastName].filter(Boolean).join(' ').trim()
      }

      const email = valueFor('email', row)
      const employeeId = valueFor('employee_id', row)
      if (!name && !email && !employeeId) return null

      if (!name) {
        name = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || employeeId || 'Unknown'
      }

      const statusRaw = valueFor('status', row)

      const record: ImportPeopleRecord = {
        name,
        team: valueFor('team', row),
        role: valueFor('role', row),
        department: valueFor('department', row),
        email,
        phone: valueFor('phone', row),
        status: statusRaw ? normalizePeopleStatus(statusRaw) : 'Active',
        last_check_out: normalizeImportDate(valueFor('last_check_out', row)),
        employee_id: employeeId,
        title: valueFor('title', row),
        site: valueFor('site', row),
        location: valueFor('location', row),
        notes: valueFor('notes', row),
      }

      return record
    })
    .filter((record): record is ImportPeopleRecord => record !== null)
}

export async function extractPeopleFromSpreadsheet(
  input: string | SpreadsheetTable,
): Promise<GriffinPeopleImportExtraction> {
  const { headers, rows } = typeof input === 'string' ? parseCsv(input) : input
  if (!headers.length || !rows.length) {
    throw new Error('The uploaded file did not contain any importable rows.')
  }

  const sampleRows = rows.slice(0, 8)
  const client = getOpenAIClient()

  const response = await client.chat.completions.create({
    model: GRIFFINEYE_AI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Map these HR / people spreadsheet columns to AssetGriffin People & teams import fields.

Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows)}`,
      },
    ],
    max_completion_tokens: 1400,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('GriffinEye returned an empty mapping response.')

  let parsed: {
    summary?: string
    columnMappings?: PeopleColumnMapping[]
    warnings?: string[]
  }

  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('GriffinEye returned invalid JSON for column mapping.')
  }

  const columnMappings = Array.isArray(parsed.columnMappings) ? parsed.columnMappings : []
  const rawRecords = applyMappings(headers, rows, columnMappings)
  const { records, duplicatesSkipped } = dedupePeopleRecords(rawRecords)
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : []

  if (duplicatesSkipped > 0) {
    warnings.push(
      `Skipped ${duplicatesSkipped} duplicate row${duplicatesSkipped === 1 ? '' : 's'} within the file (matched on employee ID or email).`,
    )
  }

  return {
    summary:
      parsed.summary ??
      `GriffinEye mapped ${columnMappings.filter((mapping) => mapping.target).length} columns and prepared ${records.length} people for review.`,
    columnMappings,
    records,
    warnings,
    rowCount: rows.length,
    duplicatesSkipped,
  }
}

export { PEOPLE_IMPORT_FIELD_LABELS } from '@/lib/griffineye-people-import-labels'
