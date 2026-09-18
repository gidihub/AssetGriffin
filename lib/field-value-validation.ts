import type { DbField } from '@/lib/schema-types'
import { fieldChoices } from '@/lib/field-ui'
import {
  BRAND_CHOICES,
  DEVICE_TYPE_CHOICES,
  MDM_ENROLLMENT_CHOICES,
  OPERATING_SYSTEM_CHOICES,
  RAM_CHOICES,
  parseSecurityMonitoringSoftware,
  SECURITY_SOFTWARE_SUGGESTIONS,
  type SecurityMonitoringSoftware,
} from '@/lib/asset-spec-fields'

export type FieldValidationIssue = {
  key: string
  invalidValue: string
  action: 'cleared' | 'mapped' | 'kept'
  mappedTo?: string
}

export type SanitizeRecordDataResult = {
  data: Record<string, unknown>
  issues: FieldValidationIssue[]
}

const CATEGORY_ALIASES: Record<string, string> = {
  laptop: 'Computers',
  laptops: 'Computers',
  desktop: 'Computers',
  desktops: 'Computers',
  computer: 'Computers',
  computers: 'Computers',
  pc: 'Computers',
  monitor: 'Displays',
  monitors: 'Displays',
  display: 'Displays',
  displays: 'Displays',
  phone: 'Mobile',
  phones: 'Mobile',
  mobile: 'Mobile',
  tablet: 'Tablets',
  tablets: 'Tablets',
  furniture: 'Furniture',
  equipment: 'Equipment',
  tool: 'Tools',
  tools: 'Tools',
  vehicle: 'Vehicles',
  vehicles: 'Vehicles',
  apparatus: 'Apparatus',
  ppe: 'PPE',
  medical: 'Medical',
}

/** Values that are brands/device words, not asset categories — must never persist on category. */
const INVALID_CATEGORY_TOKENS = new Set([
  ...BRAND_CHOICES.map((b) => b.toLowerCase()),
  'hp',
  'dell',
  'apple',
  'lenovo',
  'microsoft',
  'laptop',
  'desktop',
  'tablet',
  'monitor',
  'server',
  'phone',
])

const FIELD_ALIASES: Record<string, Record<string, string>> = {
  category: CATEGORY_ALIASES,
  brand: Object.fromEntries(BRAND_CHOICES.map((choice) => [choice.toLowerCase(), choice])),
  device_type: Object.fromEntries(DEVICE_TYPE_CHOICES.map((choice) => [choice.toLowerCase(), choice])),
  operating_system: {
    'windows 11': 'Windows 11 Pro',
    'windows 11 pro': 'Windows 11 Pro',
    'win 11': 'Windows 11 Pro',
    'windows 10': 'Windows 10',
    'win 10': 'Windows 10',
    macos: 'macOS',
    'mac os': 'macOS',
    osx: 'macOS',
    chromeos: 'ChromeOS',
    'chrome os': 'ChromeOS',
    linux: 'Linux',
  },
  ram: {
    '4 gb': '4GB',
    '4gb': '4GB',
    '8 gb': '8GB',
    '8gb': '8GB',
    '16 gb': '16GB',
    '16gb': '16GB',
    '32 gb': '32GB',
    '32gb': '32GB',
    '64 gb': '64GB+',
    '64gb': '64GB+',
    '64gb+': '64GB+',
  },
  mdm_enrollment_status: {
    enrolled: 'Enrolled',
    'not enrolled': 'Not enrolled',
    'not-enrolled': 'Not enrolled',
  },
  status: {
    available: 'Available',
    'in use': 'In use',
    'in-use': 'In use',
    'in maintenance': 'In maintenance',
    retired: 'Retired',
  },
  lifecycle_stage: {
    procurement: 'Procurement',
    deployed: 'Deployed',
    'in maintenance': 'In Maintenance',
    'retired/disposed': 'Retired/Disposed',
    retired: 'Retired/Disposed',
    disposed: 'Retired/Disposed',
  },
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function closestChoice(input: string, choices: string[]): string | null {
  const token = normalizeToken(input)
  if (!token) return null

  for (const choice of choices) {
    if (normalizeToken(choice) === token) return choice
  }

  for (const choice of choices) {
    const choiceToken = normalizeToken(choice)
    if (choiceToken.includes(token) || token.includes(choiceToken)) return choice
  }

  let best: { choice: string; score: number } | null = null
  for (const choice of choices) {
    const score = similarity(token, normalizeToken(choice))
    if (!best || score > best.score) best = { choice, score }
  }
  if (best && best.score >= 0.72) return best.choice
  return null
}

function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const longer = a.length >= b.length ? a : b
  const shorter = a.length >= b.length ? b : a
  if (longer.includes(shorter)) return shorter.length / longer.length
  let matches = 0
  const limit = Math.min(a.length, b.length)
  for (let i = 0; i < limit; i += 1) {
    if (a[i] === b[i]) matches += 1
  }
  return matches / longer.length
}

function resolveAlias(fieldKey: string, value: string): string | null {
  const aliases = FIELD_ALIASES[fieldKey]
  if (!aliases) return null
  return aliases[normalizeToken(value)] ?? null
}

function validateConstrainedValue(
  field: DbField,
  rawValue: unknown,
): { value: string; issue?: FieldValidationIssue } {
  const choices = fieldChoices(field)
  if (!choices.length) {
    return { value: typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '').trim() }
  }

  const invalidValue = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '').trim()
  if (!invalidValue) return { value: '' }

  if (choices.includes(invalidValue)) return { value: invalidValue }

  const alias = resolveAlias(field.key, invalidValue)
  if (alias && choices.includes(alias)) {
    return {
      value: alias,
      issue: { key: field.key, invalidValue, action: 'mapped', mappedTo: alias },
    }
  }

  const fuzzy = closestChoice(invalidValue, choices)
  if (fuzzy) {
    return {
      value: fuzzy,
      issue: { key: field.key, invalidValue, action: 'mapped', mappedTo: fuzzy },
    }
  }

  if (field.key === 'category' && INVALID_CATEGORY_TOKENS.has(normalizeToken(invalidValue))) {
    return {
      value: '',
      issue: { key: field.key, invalidValue, action: 'cleared' },
    }
  }

  return {
    value: '',
    issue: { key: field.key, invalidValue, action: 'cleared' },
  }
}

function sanitizeSecurityMonitoringField(rawValue: unknown): SecurityMonitoringSoftware {
  const parsed = parseSecurityMonitoringSoftware(rawValue)
  const allowed = new Set<string>([...SECURITY_SOFTWARE_SUGGESTIONS])
  const tags = parsed.tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      const exact = [...allowed].find((entry) => normalizeToken(entry) === normalizeToken(tag))
      return exact ?? tag
    })
  return { tags: [...new Set(tags)] }
}

export function sanitizeRecordData(
  data: Record<string, unknown>,
  fields: DbField[],
): SanitizeRecordDataResult {
  const next = { ...data }
  const issues: FieldValidationIssue[] = []

  for (const field of fields) {
    if (!(field.key in next)) continue
    const raw = next[field.key]

    if (field.key === 'security_monitoring_software' && field.type === 'json') {
      next[field.key] = sanitizeSecurityMonitoringField(raw)
      continue
    }

    if (field.key === 'it_details') {
      continue
    }

    if (field.type === 'select' || field.type === 'status') {
      const { value, issue } = validateConstrainedValue(field, raw)
      next[field.key] = value
      if (issue) issues.push(issue)
      continue
    }

    if (field.type === 'checkbox') {
      next[field.key] = Boolean(raw)
    }
  }

  if (!String(next.category ?? '').trim()) {
    const brand = String(next.brand ?? '').trim()
    const deviceType = String(next.device_type ?? '').trim()
    if (brand) {
      const inferred = inferCategoryFromBrand(brand, deviceType)
      if (inferred) next.category = inferred
    }
  }

  return { data: next, issues }
}

export function findInvalidSelectStatusValues(
  records: Array<{ id: string; data: Record<string, unknown> }>,
  fields: DbField[],
): Array<{ recordId: string; fieldKey: string; value: string; choices: string[] }> {
  const constrained = fields.filter((field) => field.type === 'select' || field.type === 'status')
  const invalid: Array<{ recordId: string; fieldKey: string; value: string; choices: string[] }> = []

  for (const record of records) {
    for (const field of constrained) {
      const raw = record.data[field.key]
      if (raw === null || raw === undefined || raw === '') continue
      const value = String(raw).trim()
      const choices = fieldChoices(field)
      if (!choices.includes(value)) {
        invalid.push({ recordId: record.id, fieldKey: field.key, value, choices })
      }
    }
  }

  return invalid
}

/** Infer a valid category when a brand was incorrectly stored as category. */
export function inferCategoryFromBrand(brand: string, deviceType?: string): string {
  if (deviceType) {
    const device = normalizeToken(deviceType)
    if (device.includes('laptop') || device.includes('desktop')) return 'Computers'
    if (device.includes('tablet')) return 'Tablets'
    if (device.includes('monitor')) return 'Displays'
  }
  if (brand) return 'Computers'
  return ''
}
