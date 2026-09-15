import type { DbAuditLogRow } from '@/lib/griffineye-audit'
import type { ActionEventRow } from '@/lib/actions-db'
import type { WorkspaceRecordRow } from '@/lib/record-mappers'

export type AssetPhoto = {
  id: string
  /** Supabase Storage object path — persisted on the record. */
  storagePath: string
  /** Signed URL for display — resolved at runtime, not persisted. */
  previewUrl: string
  name: string
  primary: boolean
  addedAt: string
}

export type WarrantyRecord = {
  id: string
  provider: string
  expiration: string
  coverageNotes: string
}

export type AssetAuditLink = {
  recordId: string
  name: string
  auditor: string
  auditDate: string
  site: string
  location: string
  notes: string
}

export type AssetDetailTab =
  | 'details'
  | 'photos'
  | 'events'
  | 'history'
  | 'maintenance'
  | 'warranty'
  | 'linking'
  | 'reserve'
  | 'audit'

export const ASSET_DETAIL_TABS: { id: AssetDetailTab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'photos', label: 'Photos' },
  { id: 'events', label: 'Events' },
  { id: 'history', label: 'History' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'warranty', label: 'Warranty' },
  { id: 'linking', label: 'Linking' },
  { id: 'reserve', label: 'Reserve' },
  { id: 'audit', label: 'Audit' },
]

export function assetDisplayRef(record: WorkspaceRecordRow): string {
  const tag = String(record.data.asset_tag ?? '').trim()
  const name = String(record.data.name ?? '').trim()
  if (tag && name) return `${name} (${tag})`
  return name || tag || record.id
}

export function assetMatchKeys(record: WorkspaceRecordRow): string[] {
  const tag = String(record.data.asset_tag ?? '').trim().toLowerCase()
  const name = String(record.data.name ?? '').trim().toLowerCase()
  const ref = assetDisplayRef(record).toLowerCase()
  return [record.id.toLowerCase(), tag, name, ref].filter(Boolean)
}

/** Whether a maintenance/audit row belongs to this asset. */
export function recordMatchesAsset(
  rowData: Record<string, unknown>,
  asset: WorkspaceRecordRow,
): boolean {
  const linkedId = String(rowData.asset_record_id ?? '').trim()
  if (linkedId && linkedId === asset.id) return true

  const keys = assetMatchKeys(asset)
  const assetField = String(rowData.asset ?? rowData.asset_id ?? '').trim().toLowerCase()
  if (!assetField) return false

  return keys.some((key) => key === assetField)
}

export function parseAssetPhotos(data: Record<string, unknown>): AssetPhoto[] {
  const raw = data.asset_photos
  if (!Array.isArray(raw)) return []
  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const photo = entry as Record<string, unknown>
      const storagePath = String(photo.storagePath ?? '').trim()
      const legacyPreview = String(photo.previewUrl ?? photo.url ?? '').trim()
      if (!storagePath && !legacyPreview) return null
      return {
        id: String(photo.id ?? crypto.randomUUID()),
        storagePath,
        previewUrl: legacyPreview,
        name: String(photo.name ?? 'Photo'),
        primary: Boolean(photo.primary),
        addedAt: String(photo.addedAt ?? new Date().toISOString()),
      }
    })
    .filter((photo): photo is AssetPhoto => photo !== null)
}

export function primaryPhoto(photos: AssetPhoto[]): AssetPhoto | null {
  return photos.find((photo) => photo.primary) ?? photos[0] ?? null
}

export function parseWarrantyRecords(data: Record<string, unknown>): WarrantyRecord[] {
  const raw = data.warranty_records
  if (!Array.isArray(raw)) {
    const expiration = String(data.warranty_expiration ?? '').trim()
    if (!expiration) return []
    const itDetails =
      data.it_details && typeof data.it_details === 'object' && !Array.isArray(data.it_details)
        ? (data.it_details as Record<string, unknown>)
        : {}
    return [
      {
        id: 'legacy-warranty',
        provider: String(itDetails.warrantyPlan ?? 'Warranty'),
        expiration,
        coverageNotes: String(itDetails.warrantyPlanExpiration ?? ''),
      },
    ]
  }

  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const row = entry as Record<string, unknown>
      return {
        id: String(row.id ?? crypto.randomUUID()),
        provider: String(row.provider ?? ''),
        expiration: String(row.expiration ?? ''),
        coverageNotes: String(row.coverageNotes ?? ''),
      }
    })
}

export function maintenanceRowToDisplay(row: WorkspaceRecordRow) {
  const data = row.data
  return {
    id: row.id,
    asset: String(data.asset ?? ''),
    issueType: String(data.issue_type ?? ''),
    priority: String(data.priority ?? ''),
    technician: String(data.technician ?? ''),
    dueDate: String(data.due_date ?? ''),
    status: String(data.status ?? ''),
    description: String(data.description ?? ''),
  }
}

export function auditRowToAssetLink(row: WorkspaceRecordRow): AssetAuditLink {
  const data = row.data
  return {
    recordId: row.id,
    name: String(data.name ?? ''),
    auditor: String(data.auditor ?? ''),
    auditDate: String(data.start_date ?? ''),
    site: String(data.audit_site ?? data.scope ?? ''),
    location: String(data.audit_location ?? ''),
    notes: String(data.notes ?? ''),
  }
}

export type AssetEventItem = {
  id: string
  when: string
  title: string
  detail: string
  actor: string
  source: string
}

export function auditRowToEvent(row: DbAuditLogRow): AssetEventItem {
  return {
    id: row.id,
    when: row.created_at,
    title: row.action,
    detail: row.summary || row.entity_label,
    actor: row.actor_label,
    source: row.source,
  }
}

export function actionEventToFeedItem(event: ActionEventRow): AssetEventItem {
  return {
    id: event.id,
    when: event.performedAt,
    title: event.actionName,
    detail: String(event.data.notes ?? 'Record updated'),
    actor: event.performedBy ?? 'Workspace member',
    source: 'action',
  }
}

export type FieldHistoryRow = {
  id: string
  date: string
  event: string
  field: string
  from: string
  to: string
  actor: string
}

export function fieldHistoryFromActionEvents(events: ActionEventRow[]): FieldHistoryRow[] {
  const rows: FieldHistoryRow[] = []

  for (const event of events) {
    const previous = (event.data.previous ?? {}) as Record<string, unknown>
    const next = (event.data.next ?? {}) as Record<string, unknown>
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)])

    for (const key of keys) {
      const from = formatHistoryValue(previous[key])
      const to = formatHistoryValue(next[key])
      if (from === to) continue
      rows.push({
        id: `${event.id}-${key}`,
        date: event.performedAt,
        event: event.actionName,
        field: key.replace(/_/g, ' '),
        from: from || '—',
        to: to || '—',
        actor: event.performedBy ?? 'Workspace member',
      })
    }
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date))
}

function formatHistoryValue(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function formatRelativeAssetTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso
  const deltaMs = Date.now() - then
  const minutes = Math.floor(deltaMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
