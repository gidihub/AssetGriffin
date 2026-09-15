import { getOpenAIClient, GRIFFINEYE_AI_MODEL } from '@/lib/openai'
import type { AssetStatus, LifecycleStage } from '@/lib/supabase/database.types'

export type ImportAssetRecord = {
  asset_tag: string
  name: string
  category: string
  assigned_to: string
  location: string
  status: AssetStatus
  purchase_date: string | null
  serial: string
  warranty_expiration: string | null
  depreciation_value: string
  notes: string
  lifecycle_stage: LifecycleStage
}

export type ColumnMapping = {
  source: string
  target: keyof ImportAssetRecord | null
}

export type GriffinImportExtraction = {
  summary: string
  columnMappings: ColumnMapping[]
  records: ImportAssetRecord[]
  warnings: string[]
  rowCount: number
}

const TARGET_FIELDS: Array<keyof ImportAssetRecord> = [
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
  'notes',
  'lifecycle_stage',
]

const SYSTEM_PROMPT = `You map spreadsheet columns to AssetGriffin asset import fields.

Return JSON only:
{
  "summary": "Short summary of what GriffinEye mapped",
  "columnMappings": [{ "source": "exact header from spreadsheet", "target": "asset_tag|name|..."|null }],
  "warnings": ["optional warnings"]
}

Valid targets: ${TARGET_FIELDS.join(', ')}
Map only columns you are confident about. Use null when unsure.
Do not invent data — mapping only.`

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function splitCsvRecords(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const records: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]
    const next = normalized[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '""'
        i += 1
      } else {
        inQuotes = !inQuotes
        current += char
      }
      continue
    }

    if (char === '\n' && !inQuotes) {
      if (current.trim()) records.push(current)
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) records.push(current)
  return records
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = splitCsvRecords(text)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map(parseCsvLine).filter((row) => row.some((cell) => cell.trim()))
  return { headers, rows }
}

function normalizeStatus(value: string): AssetStatus {
  const text = value.toLowerCase().trim()
  if (text.includes('maint')) return 'In maintenance'
  if (text.includes('retire') || text.includes('dispose')) return 'Retired'
  if (text.includes('stock') || text.includes('available') || text.includes('unassigned')) return 'Available'
  if (
    text.includes('unused') ||
    text.includes('not in use') ||
    text.includes('not-in-use') ||
    text.includes('not used')
  ) {
    return 'Available'
  }
  if (
    text.includes('in use') ||
    text.includes('in-use') ||
    text.includes('checked') ||
    text.includes('deploy')
  ) {
    return 'In use'
  }
  return 'Available'
}

function normalizeLifecycle(value: string): LifecycleStage {
  const text = value.toLowerCase()
  if (text.includes('maint')) return 'In Maintenance'
  if (text.includes('retire') || text.includes('dispose')) return 'Retired/Disposed'
  if (text.includes('deploy')) return 'Deployed'
  return 'Procurement'
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null

  const [year, month, day] = trimmed.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return trimmed
}

function applyMappings(
  headers: string[],
  rows: string[][],
  mappings: ColumnMapping[],
): ImportAssetRecord[] {
  const indexByHeader = new Map(headers.map((header, index) => [header, index]))
  const mappingByTarget = new Map<keyof ImportAssetRecord, string>()

  for (const mapping of mappings) {
    if (mapping.target) mappingByTarget.set(mapping.target, mapping.source)
  }

  function valueFor(target: keyof ImportAssetRecord, row: string[], fallback = ''): string {
    const source = mappingByTarget.get(target)
    if (!source) return fallback
    const index = indexByHeader.get(source)
    if (index === undefined) return fallback
    return row[index]?.trim() ?? fallback
  }

  return rows
    .map((row) => {
      const assetTag = valueFor('asset_tag', row) || valueFor('serial', row) || valueFor('name', row)
      const name = valueFor('name', row) || assetTag
      if (!assetTag && !name) return null

      const statusRaw = valueFor('status', row)
      const lifecycleRaw = valueFor('lifecycle_stage', row)

      return {
        asset_tag: assetTag || `IMPORT-${crypto.randomUUID().slice(0, 8)}`,
        name,
        category: valueFor('category', row) || 'Equipment',
        assigned_to: valueFor('assigned_to', row) || 'Unassigned',
        location: valueFor('location', row) || '',
        status: statusRaw ? normalizeStatus(statusRaw) : 'Available',
        purchase_date: normalizeDate(valueFor('purchase_date', row)),
        serial: valueFor('serial', row),
        warranty_expiration: normalizeDate(valueFor('warranty_expiration', row)),
        depreciation_value: valueFor('depreciation_value', row) || '$0',
        notes: valueFor('notes', row),
        lifecycle_stage: lifecycleRaw ? normalizeLifecycle(lifecycleRaw) : 'Procurement',
      } satisfies ImportAssetRecord
    })
    .filter((record): record is ImportAssetRecord => record !== null)
}

export async function extractAssetsFromSpreadsheet(csvText: string): Promise<GriffinImportExtraction> {
  const { headers, rows } = parseCsv(csvText)
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
        content: `Map these spreadsheet columns to AssetGriffin import fields.

Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows)}`,
      },
    ],
    max_completion_tokens: 1200,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('GriffinEye returned an empty mapping response.')

  let parsed: {
    summary?: string
    columnMappings?: ColumnMapping[]
    warnings?: string[]
  }

  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('GriffinEye returned invalid JSON for column mapping.')
  }

  const columnMappings = Array.isArray(parsed.columnMappings) ? parsed.columnMappings : []
  const records = applyMappings(headers, rows, columnMappings)

  return {
    summary:
      parsed.summary ??
      `GriffinEye mapped ${columnMappings.filter((m) => m.target).length} columns and prepared ${records.length} records for review.`,
    columnMappings,
    records,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
    rowCount: rows.length,
  }
}
