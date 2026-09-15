import type { GriffinEyeVisionFields, GriffinEyeVisionResult } from '@/lib/griffineye-intake'

const VISION_FIELD_KEYS = [
  'manufacturer',
  'model',
  'sku',
  'serialNumber',
  'manufactureDate',
  'assetTag',
  'assignedTo',
  'location',
  'conditionNotes',
  'safetyNotes',
] as const satisfies ReadonlyArray<keyof GriffinEyeVisionFields>

/** Minimum model confidence before we accept identifier fields without readableFields proof. */
const IDENTIFIER_CONFIDENCE_FLOOR = 70

const IDENTIFIER_FIELDS = new Set<keyof GriffinEyeVisionFields>([
  'manufacturer',
  'model',
  'sku',
  'serialNumber',
  'manufactureDate',
  'assetTag',
])

/** Fields that must appear in readableFields when the model supplies that manifest. */
const READABLE_MANIFEST_FIELDS = new Set<keyof GriffinEyeVisionFields>([
  'manufacturer',
  'model',
  'sku',
  'serialNumber',
  'manufactureDate',
  'assetTag',
  'safetyNotes',
])

function parseReadableFields(parsed: Record<string, unknown>): Set<string> {
  if (!Array.isArray(parsed.readableFields)) return new Set()
  return new Set(parsed.readableFields.map(String))
}

/**
 * Post-processing guard: fields not listed in readableFields (when provided) or
 * below confidence floor for identifiers are cleared and marked needs-review.
 */
export function applyVisionFabricationGuard(
  result: GriffinEyeVisionResult,
  parsed: Record<string, unknown>,
): GriffinEyeVisionResult {
  const readable = parseReadableFields(parsed)
  const hasReadableManifest = readable.size > 0
  const uncertain = new Set(result.uncertainFields)
  const fields = { ...result } as GriffinEyeVisionFields & GriffinEyeVisionResult

  for (const key of VISION_FIELD_KEYS) {
    const value = fields[key]
    if (!value || typeof value !== 'string' || !value.trim()) continue

    let strip = false
    let reason = ''

    if (hasReadableManifest && READABLE_MANIFEST_FIELDS.has(key) && !readable.has(key)) {
      strip = true
      reason = `${key} was not listed as readable in the submitted photos`
    } else if (IDENTIFIER_FIELDS.has(key) && result.confidence < IDENTIFIER_CONFIDENCE_FLOOR) {
      strip = true
      reason = `${key} confidence below review threshold (${result.confidence}% < ${IDENTIFIER_CONFIDENCE_FLOOR}%)`
    }

    if (strip) {
      fields[key] = '' as GriffinEyeVisionFields[typeof key]
      uncertain.add(key)
      if (!fields.notes.toLowerCase().includes(key.toLowerCase())) {
        fields.notes = fields.notes
          ? `${fields.notes} ${key} needs review — ${reason}.`
          : `${key} needs review — ${reason}.`
      }
    }
  }

  const suggestedFields = result.suggestedFields.filter((key) => {
    const val = fields[key]
    return typeof val === 'string' && val.trim() && !uncertain.has(key)
  })

  return {
    ...fields,
    suggestedFields,
    uncertainFields: Array.from(uncertain),
    populatedFieldCount: suggestedFields.length,
  }
}

/** Unit-test helper: simulate unreadable/blurry extraction JSON before normalize. */
export function simulateUnreadableVisionParse(): Record<string, unknown> {
  return {
    summary: 'Device visible but labels are unreadable',
    manufacturer: 'Dell',
    model: 'Latitude 5440',
    sku: 'LAT-5440-XYZ',
    serialNumber: '7XK91P2',
    manufactureDate: '2024-01',
    assetTag: '',
    category: 'Laptop',
    assignedTo: '',
    location: '',
    conditionNotes: '',
    safetyNotes: '',
    confidence: 35,
    uncertainFields: ['serialNumber', 'sku', 'manufactureDate'],
    fieldConflicts: [],
    readableFields: ['manufacturer'],
    notes: 'Label too blurry to read identifiers.',
  }
}
