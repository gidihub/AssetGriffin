import { applySpecFieldsToRecordData, parseSpecDump } from '@/lib/asset-spec-normalization'
import type { AssetIntakeDraft } from '@/lib/griffineye-intake'
import type { ImportAssetRecord } from '@/lib/griffineye-import'
import type { ImportPeopleRecord } from '@/lib/griffineye-people-import'
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

export function importRecordToPeopleData(record: ImportPeopleRecord): Record<string, unknown> {
  return {
    name: record.name.trim(),
    team: record.team.trim(),
    role: record.role.trim(),
    department: record.department.trim(),
    email: record.email.trim(),
    phone: record.phone.trim(),
    status: record.status || 'Active',
    last_check_out: record.last_check_out ?? null,
    employee_id: record.employee_id.trim(),
    title: record.title.trim(),
    site: record.site.trim(),
    location: record.location.trim(),
    notes: record.notes.trim(),
  }
}

export function importRecordToAssetData(record: ImportAssetRecord): Record<string, unknown> {
  const spec = parseSpecDump(record.name)
  const base: Record<string, unknown> = {
    asset_tag: record.asset_tag,
    name: spec.wasSpecDump ? spec.name : record.name,
    category: spec.categoryHint || record.category || 'Equipment',
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
  }
  return applySpecFieldsToRecordData(base, spec)
}

export function intakeDraftToRecordData(draft: AssetIntakeDraft): Record<string, unknown> {
  const name =
    draft.cleanName?.trim() ||
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

  const categoryFromDraft = draft.categoryHint || intakeCategoryMap[draft.category] || 'Equipment'
  const base: Record<string, unknown> = {
    asset_tag: assetTag,
    name: draft.cleanName || name,
    category: categoryFromDraft,
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
  }

  if (draft.brand) base.brand = draft.brand
  if (draft.device_type) base.device_type = draft.device_type
  if (draft.modelField) base.model = draft.modelField
  if (draft.operating_system) base.operating_system = draft.operating_system
  if (draft.processor) base.processor = draft.processor
  if (draft.ram) base.ram = draft.ram
  if (draft.storage) base.storage = draft.storage
  if (draft.color) base.color = draft.color
  if (draft.mdm_enrollment_status) base.mdm_enrollment_status = draft.mdm_enrollment_status
  if (draft.security_monitoring_software?.length) {
    base.security_monitoring_software = { tags: draft.security_monitoring_software }
  }

  if (draft.specDumpOriginalName && !draft.brand && !draft.device_type) {
    return applySpecFieldsToRecordData(base, parseSpecDump(draft.specDumpOriginalName))
  }

  return base
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

/** Normalize asset/record refs for deep-link matching (trim, coerce numeric JSON). */
export function normalizeRecordRef(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return value.trim()
  return String(value).trim()
}

function recordRefCandidates(row: WorkspaceRecordRow): string[] {
  const refs = [row.id, row.data.asset_tag, row.data.asset_id]
    .map(normalizeRecordRef)
    .filter(Boolean)
  return [...new Set(refs)]
}

/** Match a workspace row by record UUID or asset tag (display id). */
export function findRecordByRef(rows: WorkspaceRecordRow[], ref: string): WorkspaceRecordRow | undefined {
  const needle = normalizeRecordRef(ref)
  if (!needle) return undefined
  return rows.find((row) => recordRefCandidates(row).some((candidate) => candidate === needle))
}

/** Best record ref for deep-linking (prefer human-readable asset tag). */
export function recordOpenRef(row: WorkspaceRecordRow): string {
  return normalizeRecordRef(row.data.asset_tag) || row.id
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
