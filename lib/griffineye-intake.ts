import type { GriffinVisionUsageSnapshot } from '@/lib/griffin-vision-usage'

export const ASSET_CATEGORIES = [
  'Laptop',
  'Monitor',
  'Desktop',
  'Phone',
  'Tablet',
  'Equipment',
  'Tool',
  'Other',
] as const

export type AssetCategory = (typeof ASSET_CATEGORIES)[number]

/**
 * Bounds for text intake. They live here rather than beside the extraction code
 * so the modal can enforce them without pulling the OpenAI client into the
 * browser bundle.
 */
export const MAX_DESCRIPTION_LENGTH = 1000
export const MIN_DESCRIPTION_LENGTH = 3
/** Firm cap on photos per GriffinEye vision extraction (one API call, one credit). */
export const MAX_INTAKE_PHOTOS = 4

export type GriffinEyeVisionFields = {
  manufacturer: string
  model: string
  sku: string
  serialNumber: string
  manufactureDate: string
  category: AssetCategory
  assetTag: string
  assignedTo: string
  location: string
  conditionNotes: string
  safetyNotes: string
}

export type GriffinEyeFieldConflict = {
  field: keyof GriffinEyeVisionFields
  values: string[]
}

export type GriffinEyeVisionResult = GriffinEyeVisionFields & {
  summary: string
  confidence: number
  notes: string
  suggestedFields: Array<keyof GriffinEyeVisionFields>
  uncertainFields: string[]
  /** Fields where different photos disagreed — left blank for user review. */
  fieldConflicts: GriffinEyeFieldConflict[]
  populatedFieldCount: number
  usage?: GriffinVisionUsageSnapshot | null
}

export type GriffinEyeVisionErrorResponse = {
  error: string
  code?: 'VISION_CAP_EXCEEDED' | 'ABUSE_CAP_EXCEEDED'
  used?: number
  cap?: number
  tier?: string
  overageUsed?: number
  overageChargeUsd?: number
  totalUsed?: number
  abuseCeiling?: number
  /** @deprecated Legacy purchased scan balance — pack sales removed. */
  creditBalance?: number
}

export type AssetIntakeDraft = {
  manufacturer: string
  model: string
  sku?: string
  serialNumber: string
  manufactureDate?: string
  category: AssetCategory
  assetTag: string
  summary: string
  notes: string
  conditionNotes?: string
  safetyNotes?: string
  assignedTo?: string
  location?: string
  /** Parsed specification fields (reviewed before save). */
  brand?: string
  device_type?: string
  modelField?: string
  operating_system?: string
  processor?: string
  ram?: string
  storage?: string
  color?: string
  mdm_enrollment_status?: string
  security_monitoring_software?: string[]
  categoryHint?: string
  cleanName?: string
  specDumpOriginalName?: string
}
