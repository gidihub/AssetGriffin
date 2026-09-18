import type { SupabaseClient } from '@supabase/supabase-js'

/** Sub-logs the activity timeline is split into. */
export const AUDIT_CATEGORIES = ['record', 'user', 'import', 'ai'] as const
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number]

/** How the change was made — lets "changed via import" vs "changed manually" be answered. */
export const AUDIT_SOURCES = ['manual', 'import', 'griffineye', 'system', 'api'] as const
export type AuditSource = (typeof AUDIT_SOURCES)[number]

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  record: 'Record logs',
  user: 'User activity',
  import: 'Import logs',
  ai: 'AI logs',
}

export type AuditLogEntry = {
  /** Stable id assigned before insert — preserved across retry attempts. */
  id?: string
  category: AuditCategory
  action: string
  source?: AuditSource
  actorId?: string | null
  actorLabel?: string
  entityType?: string
  entityId?: string | null
  entityLabel?: string
  summary?: string
  metadata?: Record<string, unknown>
}

export type DbAuditLogRow = {
  id: string
  organization_id: string
  category: AuditCategory
  action: string
  source: AuditSource
  actor_id: string | null
  actor_label: string
  entity_type: string
  entity_id: string | null
  entity_label: string
  summary: string
  metadata: Record<string, unknown>
  created_at: string
}

function toAuditRow(organizationId: string, entry: AuditLogEntry) {
  return {
    ...(entry.id ? { id: entry.id } : {}),
    organization_id: organizationId,
    category: entry.category,
    action: entry.action,
    source: entry.source ?? 'manual',
    actor_id: entry.actorId ?? null,
    actor_label: entry.actorLabel ?? 'System',
    entity_type: entry.entityType ?? '',
    entity_id: entry.entityId ?? null,
    entity_label: entry.entityLabel ?? '',
    summary: entry.summary ?? '',
    metadata: entry.metadata ?? {},
  }
}

/**
 * Appends an audit event. Never throws — a failed log write must not fail the
 * user's action, so problems are reported to the server console instead.
 */
export async function recordAuditEvent(
  supabase: SupabaseClient,
  organizationId: string,
  entry: AuditLogEntry,
): Promise<void> {
  const { error } = await supabase.from('audit_log').insert(toAuditRow(organizationId, entry))

  if (error) {
    console.error('[audit-log] failed to record event', entry.action, error.message)
  }
}

/**
 * Appends many events in one round trip. Import batches can run to thousands of
 * records, where one insert per row would dominate the request.
 */
export async function recordAuditEvents(
  supabase: SupabaseClient,
  organizationId: string,
  entries: AuditLogEntry[],
): Promise<void> {
  if (!entries.length) return

  const { error } = await supabase.from('audit_log').upsert(
    entries.map((entry) => toAuditRow(organizationId, entry)),
    { onConflict: 'id', ignoreDuplicates: true },
  )

  if (error) {
    console.error(`[audit-log] failed to record ${entries.length} events`, error.message)
    throw new Error(error.message)
  }
}

/** Retries audit inserts so a committed import is not reported as failed. */
export async function recordAuditEventsWithRetry(
  supabase: SupabaseClient,
  organizationId: string,
  entries: AuditLogEntry[],
  maxAttempts = 3,
): Promise<void> {
  const entriesWithIds = entries.map((entry) => ({
    ...entry,
    id: entry.id ?? crypto.randomUUID(),
  }))
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await recordAuditEvents(supabase, organizationId, entriesWithIds)
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Audit logging failed.')
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 100))
      }
    }
  }

  throw lastError ?? new Error('Audit logging failed.')
}
