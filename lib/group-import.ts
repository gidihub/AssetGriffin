import type { ImportPeopleRecord } from '@/lib/griffineye-people-import'

export const MAX_GROUP_IMPORT_ROWS = 2000

/** Groups that support bulk import via /api/groups/[slug]/import */
export const GROUP_IMPORT_SLUGS = ['people'] as const
export type GroupImportSlug = (typeof GROUP_IMPORT_SLUGS)[number]

export function isGroupImportSlug(slug: string): slug is GroupImportSlug {
  return (GROUP_IMPORT_SLUGS as readonly string[]).includes(slug)
}

export function isImportPeopleRecord(value: unknown): value is ImportPeopleRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.name === 'string' && record.name.trim().length > 0
}

export type ImportValidationError = { index: number; reason: string }

export function validateImportPeopleRecords(
  rows: unknown,
): { ok: true; records: ImportPeopleRecord[] } | { ok: false; errors: ImportValidationError[] } {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, errors: [{ index: -1, reason: 'No records provided.' }] }
  }

  const errors: ImportValidationError[] = []
  const records: ImportPeopleRecord[] = []

  rows.forEach((row, index) => {
    if (!isImportPeopleRecord(row)) {
      errors.push({ index, reason: 'Each row must include a non-empty name.' })
      return
    }
    records.push(row)
  })

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, records }
}

export type GriffinExtractTargetGroup = 'assets' | GroupImportSlug

export function parseExtractTargetGroup(value: FormDataEntryValue | null): GriffinExtractTargetGroup {
  const raw = String(value ?? 'assets').trim().toLowerCase()
  if (raw === 'people') return 'people'
  return 'assets'
}
