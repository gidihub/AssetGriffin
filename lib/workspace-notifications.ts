import type { GriffinEyeObservation } from '@/lib/griffineye-insights'
import type { DataGapSummary } from '@/lib/griffineye-agent/tools'
import type { DbAuditLogRow } from '@/lib/griffineye-audit'

export type WorkspaceNotificationKind = 'maintenance' | 'data-health' | 'griffineye' | 'audit'

export type WorkspaceNotification = {
  id: string
  kind: WorkspaceNotificationKind
  title: string
  detail?: string
  time?: string
}

type BuildWorkspaceNotificationsInput = {
  maintenanceCount: number
  dataHealth: DataGapSummary[]
  observations: GriffinEyeObservation[]
  auditEvents: DbAuditLogRow[]
  formatRelativeTime: (iso: string) => string
}

export function buildWorkspaceNotifications({
  maintenanceCount,
  dataHealth,
  observations,
  auditEvents,
  formatRelativeTime,
}: BuildWorkspaceNotificationsInput): WorkspaceNotification[] {
  const items: WorkspaceNotification[] = []

  if (maintenanceCount > 0) {
    items.push({
      id: 'maintenance-active',
      kind: 'maintenance',
      title: `${maintenanceCount} asset${maintenanceCount === 1 ? '' : 's'} in maintenance`,
      detail: 'Review status in Assets',
    })
  }

  for (const gap of dataHealth.filter((entry) => entry.missing > 0).slice(0, 3)) {
    items.push({
      id: `data-gap-${gap.field}`,
      kind: 'data-health',
      title: `${gap.missing} missing ${gap.label.toLowerCase()}`,
      detail: `${gap.percent}% of records blank`,
    })
  }

  for (const observation of observations) {
    items.push({
      id: `griffineye-${observation.id}`,
      kind: 'griffineye',
      title: observation.message,
      detail: 'GriffinEye insight',
    })
  }

  for (const event of auditEvents.slice(0, 3)) {
    items.push({
      id: `audit-${event.id}`,
      kind: 'audit',
      title: event.summary || event.action,
      detail: event.entity_label ? `${event.actor_label} · ${event.entity_label}` : event.actor_label,
      time: formatRelativeTime(event.created_at),
    })
  }

  return items
}

function notificationSignatureEntry(item: WorkspaceNotification): string {
  return JSON.stringify({
    id: item.id,
    kind: item.kind,
    title: item.title,
    detail: item.detail ?? '',
  })
}

export function notificationSignature(notifications: WorkspaceNotification[]): string {
  return notifications.map(notificationSignatureEntry).join('|')
}

export function notificationsAckStorageKey(organizationId: string): string {
  return `ag-notifications-ack-${organizationId}`
}

export function readAcknowledgedNotificationSignature(organizationId: string | null): string {
  if (!organizationId || typeof window === 'undefined') return ''
  return window.localStorage.getItem(notificationsAckStorageKey(organizationId)) ?? ''
}

export function writeAcknowledgedNotificationSignature(
  organizationId: string | null,
  signature: string,
): void {
  if (!organizationId || typeof window === 'undefined') return
  window.localStorage.setItem(notificationsAckStorageKey(organizationId), signature)
}
