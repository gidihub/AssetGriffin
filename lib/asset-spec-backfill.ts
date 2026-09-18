import { ASSET_SPEC_FIELD_KEYS } from '@/lib/asset-spec-fields'
import { applySpecFieldsToRecordData, isSpecDumpName, parseSpecDump } from '@/lib/asset-spec-normalization'
import { mergeSpecReviewIntoRecordData, specReviewFromParsed, type SpecReviewFields } from '@/lib/asset-spec-review'
import { sanitizeRecordData } from '@/lib/field-value-validation'
import type { DbField, DbRecord } from '@/lib/supabase/database.types'

export type SpecBackfillProposal = {
  recordId: string
  assetTag: string
  currentName: string
  currentData: Record<string, unknown>
  review: SpecReviewFields
  suggestedFields: string[]
  proposedData: Record<string, unknown>
}

function hasStructuredSpecFields(data: Record<string, unknown>): boolean {
  return ASSET_SPEC_FIELD_KEYS.some((key) => {
    if (key === 'security_monitoring_software') {
      const raw = data[key]
      return Boolean(
        raw &&
          typeof raw === 'object' &&
          !Array.isArray(raw) &&
          Array.isArray((raw as { tags?: unknown }).tags) &&
          (raw as { tags: unknown[] }).tags.length > 0,
      )
    }
    return String(data[key] ?? '').trim().length > 0
  })
}

export function buildSpecBackfillProposal(
  record: Pick<DbRecord, 'id' | 'data'>,
  fields: DbField[],
): SpecBackfillProposal | null {
  const data = (record.data ?? {}) as Record<string, unknown>
  const currentName = String(data.name ?? '').trim()
  if (!currentName || !isSpecDumpName(currentName)) return null
  if (hasStructuredSpecFields(data)) return null

  const parsed = parseSpecDump(currentName)
  if (!parsed.wasSpecDump) return null

  const review = specReviewFromParsed(parsed)
  const merged = mergeSpecReviewIntoRecordData(data, review)
  const proposedData = sanitizeRecordData(merged, fields).data

  return {
    recordId: record.id,
    assetTag: String(data.asset_tag ?? record.id),
    currentName,
    currentData: data,
    review,
    suggestedFields: parsed.suggestedFields,
    proposedData,
  }
}

export function applySpecBackfillReview(
  proposal: Pick<SpecBackfillProposal, 'currentData' | 'review'>,
  fields: DbField[],
): Record<string, unknown> {
  const merged = mergeSpecReviewIntoRecordData(proposal.currentData, proposal.review)
  return sanitizeRecordData(merged, fields).data
}

export function buildSpecBackfillProposals(
  records: Pick<DbRecord, 'id' | 'data'>[],
  fields: DbField[],
): SpecBackfillProposal[] {
  return records
    .map((record) => buildSpecBackfillProposal(record, fields))
    .filter((proposal): proposal is SpecBackfillProposal => proposal !== null)
}
