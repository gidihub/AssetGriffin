import { ASSET_RECORD_KEYS, type AssetRecordData } from '@/lib/schema-types'

/** Normalize a Postgres date or ISO string to YYYY-MM-DD for parity checks. */
export function normalizeDateValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const parsed = new Date(trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
    return trimmed
  }
  return String(value)
}

export function normalizeNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function assetRowToExpectedData(asset: Record<string, unknown>): AssetRecordData {
  return {
    asset_tag: String(asset.asset_tag ?? ''),
    name: String(asset.name ?? ''),
    category: String(asset.category ?? ''),
    assigned_to: String(asset.assigned_to ?? ''),
    location: String(asset.location ?? ''),
    status: String(asset.status ?? ''),
    purchase_date: normalizeDateValue(asset.purchase_date),
    serial: String(asset.serial ?? ''),
    warranty_expiration: normalizeDateValue(asset.warranty_expiration),
    depreciation_value: String(asset.depreciation_value ?? ''),
    purchase_value: normalizeNumberValue(asset.purchase_value),
    notes: String(asset.notes ?? ''),
    lifecycle_stage: String(asset.lifecycle_stage ?? ''),
    lifecycle_dates:
      asset.lifecycle_dates && typeof asset.lifecycle_dates === 'object' && !Array.isArray(asset.lifecycle_dates)
        ? (asset.lifecycle_dates as Record<string, string>)
        : {},
    it_details:
      asset.it_details && typeof asset.it_details === 'object' && !Array.isArray(asset.it_details)
        ? (asset.it_details as Record<string, unknown>)
        : null,
  }
}

export function recordDataToComparable(data: Record<string, unknown>): AssetRecordData {
  return assetRowToExpectedData(data)
}

export type ParityMismatch = {
  assetId: string
  field: string
  legacy: unknown
  record: unknown
}

export function compareAssetToRecordData(
  assetId: string,
  legacy: Record<string, unknown>,
  recordData: Record<string, unknown>,
): ParityMismatch[] {
  const expected = assetRowToExpectedData(legacy)
  const actual = recordDataToComparable(recordData)
  const mismatches: ParityMismatch[] = []

  for (const key of ASSET_RECORD_KEYS) {
    const left = expected[key]
    const right = actual[key]

    if (key === 'lifecycle_dates' || key === 'it_details') {
      const leftJson = JSON.stringify(left ?? (key === 'lifecycle_dates' ? {} : null))
      const rightJson = JSON.stringify(right ?? (key === 'lifecycle_dates' ? {} : null))
      if (leftJson !== rightJson) {
        mismatches.push({ assetId, field: key, legacy: left, record: right })
      }
      continue
    }

    if (key === 'purchase_value') {
      if (left !== right) {
        mismatches.push({ assetId, field: key, legacy: left, record: right })
      }
      continue
    }

    if (left !== right) {
      mismatches.push({ assetId, field: key, legacy: left, record: right })
    }
  }

  return mismatches
}
