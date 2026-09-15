import type { AssetIntakeDraft } from '@/lib/griffineye-intake'
import type { ImportAssetRecord } from '@/lib/griffineye-import'
import { normalizeDateValue } from '@/lib/records-parity'
import type { DbRecord } from '@/lib/supabase/database.types'
import type { AssetRecord, LifecycleStage } from '@/lib/workspace-data'

const intakeCategoryMap: Record<string, string> = {
  Laptop: 'Computers',
  Monitor: 'Displays',
  Desktop: 'Computers',
  Phone: 'Mobile',
  Tablet: 'Tablets',
  Equipment: 'Equipment',
  Tool: 'Tools',
  Other: 'Equipment',
}

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const normalized = normalizeDateValue(iso)
  if (!normalized) return ''
  const parsed = new Date(`${normalized}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return normalized
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function importRecordToAssetData(record: ImportAssetRecord): Record<string, unknown> {
  return {
    asset_tag: record.asset_tag,
    name: record.name,
    category: record.category || 'Equipment',
    assigned_to: record.assigned_to || 'Unassigned',
    location: record.location ?? '',
    status: record.status || 'Available',
    purchase_date: record.purchase_date ?? null,
    serial: record.serial ?? '',
    warranty_expiration: record.warranty_expiration ?? null,
    depreciation_value: record.depreciation_value || '$0',
    purchase_value: null,
    notes: record.notes ?? '',
    lifecycle_stage: record.lifecycle_stage || 'Procurement',
    lifecycle_dates: record.purchase_date ? { Procurement: record.purchase_date } : {},
    it_details: null,
  }
}

export function intakeDraftToRecordData(draft: AssetIntakeDraft): Record<string, unknown> {
  const name =
    [draft.manufacturer, draft.model].filter(Boolean).join(' ') ||
    draft.summary ||
    'Untitled asset'

  const assetTag =
    draft.assetTag.trim() ||
    `DRAFT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

  const identifierParts = [
    draft.sku?.trim() ? `SKU: ${draft.sku.trim()}` : '',
    draft.manufactureDate?.trim() ? `Manufactured: ${draft.manufactureDate.trim()}` : '',
    draft.safetyNotes?.trim() ?? '',
  ].filter(Boolean)

  const noteParts = [draft.notes, draft.conditionNotes, identifierParts.join(' · ')].filter(Boolean)

  return {
    asset_tag: assetTag,
    name,
    category: intakeCategoryMap[draft.category] ?? 'Equipment',
    assigned_to: draft.assignedTo?.trim() || 'Unassigned',
    location: draft.location?.trim() ?? '',
    status: 'Available',
    purchase_date: null,
    serial: draft.serialNumber.trim(),
    warranty_expiration: null,
    depreciation_value: '$0',
    purchase_value: null,
    notes: noteParts.join(' ') || 'Created via GriffinEye intake — reviewed by user.',
    lifecycle_stage: 'Procurement',
    lifecycle_dates: {},
    it_details: null,
  }
}

export function dbRecordToAssetRecord(record: DbRecord): AssetRecord {
  const data = record.data ?? {}
  const lifecycleDatesRaw =
    data.lifecycle_dates && typeof data.lifecycle_dates === 'object' && !Array.isArray(data.lifecycle_dates)
      ? (data.lifecycle_dates as Record<string, string>)
      : {}

  const itDetailsRaw =
    data.it_details && typeof data.it_details === 'object' && !Array.isArray(data.it_details)
      ? (data.it_details as AssetRecord['itDetails'])
      : undefined

  return {
    id: String(data.asset_tag ?? '').trim() || record.id,
    name: String(data.name ?? ''),
    category: String(data.category ?? ''),
    assignedTo: String(data.assigned_to ?? 'Unassigned'),
    location: String(data.location || 'Unassigned'),
    status: String(data.status ?? 'Available') as AssetRecord['status'],
    purchaseDate: formatDisplayDate(data.purchase_date as string | null),
    serial: String(data.serial ?? ''),
    warrantyExpiration: formatDisplayDate(data.warranty_expiration as string | null),
    depreciationValue: String(data.depreciation_value ?? '$0'),
    notes: String(data.notes ?? ''),
    lifecycleStage: String(data.lifecycle_stage ?? 'Procurement') as LifecycleStage,
    lifecycleDates: Object.fromEntries(
      Object.entries(lifecycleDatesRaw).map(([stage, date]) => [stage, formatDisplayDate(date)]),
    ) as AssetRecord['lifecycleDates'],
    itDetails: itDetailsRaw,
  }
}

export type WorkspaceRecordRow = {
  id: string
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/** Match a workspace row by record UUID or asset tag (display id). */
export function findRecordByRef(rows: WorkspaceRecordRow[], ref: string): WorkspaceRecordRow | undefined {
  const needle = ref.trim()
  if (!needle) return undefined
  return rows.find(
    (row) =>
      row.id === needle ||
      String(row.data.asset_tag ?? '').trim() === needle ||
      String(row.data.asset_id ?? '').trim() === needle,
  )
}

/** Best record ref for deep-linking (prefer human-readable asset tag). */
export function recordOpenRef(row: WorkspaceRecordRow): string {
  return String(row.data.asset_tag ?? row.id).trim() || row.id
}

/** Map onboarding template AssetRecord (display dates) into records.data jsonb. */
export function assetRecordToRecordData(asset: AssetRecord): Record<string, unknown> {
  const lifecycleDates: Record<string, string> = {}
  for (const [stage, date] of Object.entries(asset.lifecycleDates ?? {})) {
    const normalized = normalizeDateValue(date)
    if (normalized) lifecycleDates[stage] = normalized
  }

  return {
    asset_tag: asset.id,
    name: asset.name,
    category: asset.category,
    assigned_to: asset.assignedTo || 'Unassigned',
    location: asset.location ?? '',
    status: asset.status,
    purchase_date: normalizeDateValue(asset.purchaseDate),
    serial: asset.serial ?? '',
    warranty_expiration: normalizeDateValue(asset.warrantyExpiration),
    depreciation_value: asset.depreciationValue || '$0',
    purchase_value: null,
    notes: asset.notes ?? '',
    lifecycle_stage: asset.lifecycleStage,
    lifecycle_dates: lifecycleDates,
    it_details: asset.itDetails ?? null,
  }
}

export function dbRecordToRow(record: DbRecord): WorkspaceRecordRow {
  return {
    id: record.id,
    data: record.data ?? {},
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}
