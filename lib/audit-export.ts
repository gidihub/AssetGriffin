import type { DbAuditLogRow } from '@/lib/griffineye-audit'
import {
  generateTabularExport,
  type ExportColumn,
  type RecordExportFormat,
} from '@/lib/record-export'

const AUDIT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'timestamp', header: 'Timestamp' },
  { key: 'user', header: 'User' },
  { key: 'action', header: 'Action' },
  { key: 'category', header: 'Category' },
  { key: 'entity_type', header: 'Entity type' },
  { key: 'entity', header: 'Entity name' },
  { key: 'source', header: 'Via' },
  { key: 'summary', header: 'Summary' },
]

function formatAuditTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toISOString()
}

function auditRows(events: DbAuditLogRow[]): Record<string, unknown>[] {
  return events.map((event) => ({
    timestamp: formatAuditTimestamp(event.created_at),
    user: event.actor_label || 'System',
    action: event.action,
    category: event.category,
    entity_type: event.entity_type || '',
    entity: event.entity_label || '',
    source: event.source,
    summary: event.summary || '',
  }))
}

export function buildAuditExportFilename(format: RecordExportFormat): string {
  return `audit-log-export-${new Date().toISOString().slice(0, 10)}.${format}`
}

export async function generateAuditExport(
  events: DbAuditLogRow[],
  format: RecordExportFormat,
): Promise<{ blob: Blob; filename: string }> {
  if (!events.length) {
    throw new Error('No activity to export.')
  }

  return generateTabularExport(
    AUDIT_EXPORT_COLUMNS,
    auditRows(events),
    buildAuditExportFilename(format),
    format,
  )
}
