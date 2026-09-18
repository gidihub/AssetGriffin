import { importPeopleRecordsForCurrentOrg } from '@/lib/groups-db'
import type { ImportPeopleRecord } from '@/lib/griffineye-people-import'
import { recordAuditEventsWithRetry } from '@/lib/griffineye-audit'
import {
  GROUP_IMPORT_SLUGS,
  isGroupImportSlug,
  MAX_GROUP_IMPORT_ROWS,
  validateImportPeopleRecords,
} from '@/lib/group-import'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params

    if (!isGroupImportSlug(slug)) {
      return Response.json(
        {
          error:
            slug === 'assets'
              ? 'Use /api/assets/import for asset imports with photo hydration.'
              : `Import is not configured for this group. Supported: ${GROUP_IMPORT_SLUGS.join(', ')}.`,
        },
        { status: 400 },
      )
    }

    const { supabase, profile } = await requireUserProfile()
    const parsed: unknown = await request.json()
    const recordsPayload =
      parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) && 'records' in parsed
        ? (parsed as { records: unknown }).records
        : undefined
    const validation = validateImportPeopleRecords(recordsPayload)

    if (!validation.ok) {
      return Response.json(
        { error: 'Import validation failed.', validationErrors: validation.errors },
        { status: 400 },
      )
    }

    const records = validation.records

    if (records.length > MAX_GROUP_IMPORT_ROWS) {
      return Response.json({ error: `Import batches are limited to ${MAX_GROUP_IMPORT_ROWS.toLocaleString()} records.` }, { status: 400 })
    }

    const { records: inserted } = await importPeopleRecordsForCurrentOrg(records)

    const actorLabel = profile.full_name || profile.email
    const personLabel = inserted.length === 1 ? 'person' : 'people'

    try {
      await recordAuditEventsWithRetry(supabase, profile.organization_id, [
      {
        category: 'import',
        action: 'Imported spreadsheet',
        source: 'import',
        actorId: profile.id,
        actorLabel,
        entityType: 'Import batch',
        entityLabel: `${inserted.length} ${personLabel}`,
        summary: `Imported ${inserted.length} ${personLabel} from an HR export.`,
        metadata: { imported: inserted.length, group: slug },
      },
      ...inserted.map((record) => {
        const data = (record.data ?? {}) as Record<string, unknown>
        const name = String(data.name ?? 'Person')
        const email = String(data.email ?? '')
        return {
          category: 'import' as const,
          action: 'Imported person',
          source: 'import' as const,
          actorId: profile.id,
          actorLabel,
          entityType: 'Person',
          entityId: record.id,
          entityLabel: email ? `${name} (${email})` : name,
          summary: 'Created via people import.',
          metadata: {
            department: data.department,
            title: data.title,
            employeeId: data.employee_id,
          },
        }
      }),
    ])
    } catch (auditError) {
      console.error('[groups/import] Records imported but audit logging failed', auditError)
    }

    return Response.json({
      imported: inserted.length,
      records: inserted,
      group: slug,
    })
  } catch (error) {
    console.error('[groups/import]', error)
    const message = error instanceof Error ? error.message : 'Import failed.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
