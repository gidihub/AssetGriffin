import type { AssetSpecFieldKey } from '@/lib/asset-spec-fields'
import { applySpecFieldsToRecordData, type ParsedAssetSpec } from '@/lib/asset-spec-normalization'

export type SpecReviewFields = {
  originalName: string
  cleanName: string
  categoryHint: string
  brand: string
  device_type: string
  model: string
  operating_system: string
  processor: string
  ram: string
  storage: string
  color: string
  mdm_enrollment_status: string
  security_monitoring_software: string[]
}

export function specReviewFromParsed(parsed: ParsedAssetSpec): SpecReviewFields {
  return {
    originalName: parsed.originalName,
    cleanName: parsed.name,
    categoryHint: parsed.categoryHint,
    brand: parsed.brand,
    device_type: parsed.device_type,
    model: parsed.model,
    operating_system: parsed.operating_system,
    processor: parsed.processor,
    ram: parsed.ram,
    storage: parsed.storage,
    color: parsed.color,
    mdm_enrollment_status: parsed.mdm_enrollment_status,
    security_monitoring_software: parsed.security_monitoring_software,
  }
}

export function mergeSpecReviewIntoRecordData(
  data: Record<string, unknown>,
  review: SpecReviewFields,
  options?: { keepOriginalName?: boolean },
): Record<string, unknown> {
  const parsed: ParsedAssetSpec = {
    name: options?.keepOriginalName ? String(data.name ?? review.originalName) : review.cleanName,
    categoryHint: review.categoryHint,
    brand: review.brand,
    device_type: review.device_type,
    model: review.model,
    operating_system: review.operating_system,
    processor: review.processor,
    ram: review.ram,
    storage: review.storage,
    color: review.color,
    mdm_enrollment_status: review.mdm_enrollment_status,
    security_monitoring_software: review.security_monitoring_software,
    notesAppend:
      review.originalName.trim() !== review.cleanName.trim()
        ? `Original name/spec string: ${review.originalName}`
        : '',
    originalName: review.originalName,
    wasSpecDump: true,
    suggestedFields: [] as AssetSpecFieldKey[],
  }

  return applySpecFieldsToRecordData(data, parsed)
}
