import {
  ASSET_CATEGORIES,
  type AssetCategory,
  type GriffinEyeFieldConflict,
  type GriffinEyeVisionFields,
  type GriffinEyeVisionResult,
} from '@/lib/griffineye-intake'

/**
 * Photo intake and text intake feed the same review screen, so they must agree
 * on the JSON contract and on how a model's output becomes suggested fields.
 * Both live here; only the prompt wording differs between the two.
 */
export const EXTRACTION_JSON_CONTRACT = `Return JSON only:
{
  "summary": "",
  "manufacturer": "",
  "model": "",
  "sku": "",
  "serialNumber": "",
  "manufactureDate": "",
  "assetTag": "",
  "category": "${ASSET_CATEGORIES.join('|')}",
  "assignedTo": "",
  "location": "",
  "conditionNotes": "",
  "safetyNotes": "",
  "confidence": 0,
  "uncertainFields": [],
  "fieldConflicts": [{ "field": "serialNumber", "values": ["reading A", "reading B"] }],
  "readableFields": ["manufacturer", "model"],
  "notes": ""
}`

function normalizeCategory(value: string): AssetCategory {
  const match = ASSET_CATEGORIES.find((category) => category.toLowerCase() === value.trim().toLowerCase())
  return match ?? 'Other'
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * A field is only marked as GriffinEye-suggested when it has a value the model
 * was confident about — that drives the sparkle icon on the review screen, so a
 * guess must never be presented as a suggestion.
 */
function buildSuggestedFields(
  fields: GriffinEyeVisionFields,
  uncertain: Set<string>,
): Array<keyof GriffinEyeVisionFields> {
  return (Object.keys(fields) as Array<keyof GriffinEyeVisionFields>).filter(
    (key) => Boolean(fields[key]) && !uncertain.has(key),
  )
}

export type NormalizeExtractionOptions = {
  /** Used when the model omits a summary. */
  fallbackSummary: string
  /** Appended to notes when no serial number came back, phrased for the source. */
  missingSerialNote: string
}

export function parseExtractionJson(content: string | null | undefined): Record<string, unknown> {
  if (!content) throw new Error('GriffinEye returned an empty response.')
  try {
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    throw new Error('GriffinEye returned invalid JSON for asset extraction.')
  }
}

const VISION_FIELD_KEYS = new Set<keyof GriffinEyeVisionFields>([
  'manufacturer',
  'model',
  'sku',
  'serialNumber',
  'manufactureDate',
  'assetTag',
  'category',
  'assignedTo',
  'location',
  'conditionNotes',
  'safetyNotes',
])

function parseFieldConflicts(parsed: Record<string, unknown>): GriffinEyeFieldConflict[] {
  if (!Array.isArray(parsed.fieldConflicts)) return []

  const conflicts: GriffinEyeFieldConflict[] = []
  for (const entry of parsed.fieldConflicts) {
    if (!entry || typeof entry !== 'object') continue
    const row = entry as Record<string, unknown>
    const field = String(row.field ?? '') as keyof GriffinEyeVisionFields
    if (!VISION_FIELD_KEYS.has(field)) continue
    const values = Array.isArray(row.values)
      ? row.values.map((value) => clean(value)).filter(Boolean)
      : []
    if (values.length < 2) continue
    conflicts.push({ field, values })
  }
  return conflicts
}

export function normalizeExtraction(
  parsed: Record<string, unknown>,
  { fallbackSummary, missingSerialNote }: NormalizeExtractionOptions,
): GriffinEyeVisionResult {
  const uncertain = new Set(
    Array.isArray(parsed.uncertainFields) ? parsed.uncertainFields.map(String) : [],
  )
  const fieldConflicts = parseFieldConflicts(parsed)
  for (const conflict of fieldConflicts) {
    uncertain.add(conflict.field)
  }

  const rawCategory = uncertain.has('category') ? '' : clean(parsed.category)
  const categorySuggested =
    Boolean(rawCategory) &&
    ASSET_CATEGORIES.some((category) => category.toLowerCase() === rawCategory.toLowerCase())

  const fields: GriffinEyeVisionFields = {
    manufacturer: uncertain.has('manufacturer') ? '' : clean(parsed.manufacturer),
    model: uncertain.has('model') ? '' : clean(parsed.model),
    sku: uncertain.has('sku') ? '' : clean(parsed.sku),
    serialNumber: uncertain.has('serialNumber') ? '' : clean(parsed.serialNumber),
    manufactureDate: uncertain.has('manufactureDate') ? '' : clean(parsed.manufactureDate),
    assetTag: uncertain.has('assetTag') ? '' : clean(parsed.assetTag),
    category: categorySuggested ? normalizeCategory(rawCategory) : 'Other',
    assignedTo: uncertain.has('assignedTo') ? '' : clean(parsed.assignedTo),
    location: uncertain.has('location') ? '' : clean(parsed.location),
    conditionNotes: uncertain.has('conditionNotes') ? '' : clean(parsed.conditionNotes),
    safetyNotes: uncertain.has('safetyNotes') ? '' : clean(parsed.safetyNotes),
  }

  // A serial is the field people most often need and least often get, so an
  // empty one is always called out rather than left as a silent blank.
  let notes = clean(parsed.notes)
  if (!fields.serialNumber) {
    uncertain.add('serialNumber')
    if (!notes.toLowerCase().includes('serial')) {
      notes = notes ? `${notes} ${missingSerialNote}` : missingSerialNote
    }
  }

  if (fieldConflicts.length) {
    const conflictSummary = fieldConflicts
      .map((conflict) => `${conflict.field}: ${conflict.values.join(' vs ')}`)
      .join('; ')
    const conflictNote = `Some photos disagreed on ${fieldConflicts.map((c) => c.field).join(', ')} — please confirm (${conflictSummary}).`
    notes = notes ? `${notes} ${conflictNote}` : conflictNote
  }

  const suggestedFields = buildSuggestedFields(fields, uncertain).filter(
    (key) => key !== 'category' || categorySuggested,
  )

  return {
    summary: clean(parsed.summary) || fallbackSummary,
    confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
    ...fields,
    notes,
    suggestedFields,
    uncertainFields: Array.from(uncertain),
    fieldConflicts,
    populatedFieldCount: suggestedFields.length,
  }
}
