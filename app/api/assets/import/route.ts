import { importAssetsWithPhotosForCurrentOrg } from '@/lib/assets-db'
import type { ImportAssetRecord } from '@/lib/griffineye-import'
import { recordAuditEventsWithRetry } from '@/lib/griffineye-audit'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type ImportValidationError = { index: number; reason: string }

function isImportRecord(value: unknown): value is ImportAssetRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (typeof record.asset_tag !== 'string' || typeof record.name !== 'string') return false
  if (
    record.photo_url !== undefined &&
    record.photo_url !== null &&
    typeof record.photo_url !== 'string'
  ) {
    return false
  }
  return true
}

function validateImportAssetRecords(
  rows: unknown,
): { ok: true; records: ImportAssetRecord[] } | { ok: false; errors: ImportValidationError[] } {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, errors: [{ index: -1, reason: 'No records provided.' }] }
  }

  const errors: ImportValidationError[] = []
  const records: ImportAssetRecord[] = []

  rows.forEach((row, index) => {
    if (!isImportRecord(row)) {
      errors.push({
        index,
        reason: 'Each row must include asset_tag and name; photo_url must be a string when provided.',
      })
      return
    }
    records.push(row)
  })

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, records }
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await requireUserProfile()

    const parsed: unknown = await request.json()
    const recordsPayload =
      parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) && 'records' in parsed
        ? (parsed as { records: unknown }).records
        : undefined
    const validation = validateImportAssetRecords(recordsPayload)

    if (!validation.ok) {
      return Response.json(
        { error: 'Import validation failed.', validationErrors: validation.errors },
        { status: 400 },
      )
    }

    const records = validation.records

    if (records.length > 2000) {
      return Response.json({ error: 'Import batches are limited to 2,000 records.' }, { status: 400 })
    }

    const { assets: inserted, photos } = await importAssetsWithPhotosForCurrentOrg(records)

    // One event per imported asset, so "what changed via import?" can name the
    // records rather than only the batch. A batch summary event fronts them.
    const actorLabel = profile.full_name || profile.email
    const assetLabel = inserted.length === 1 ? 'asset' : 'assets'
    const photoSummary =
      photos.attached > 0
        ? ` Attached ${photos.attached} photo${photos.attached === 1 ? '' : 's'}.`
        : ''

    try {
      await recordAuditEventsWithRetry(supabase, profile.organization_id, [
      {
        category: 'import',
        action: 'Imported spreadsheet',
        source: 'import',
        actorId: profile.id,
        actorLabel,
        entityType: 'Import batch',
        entityLabel: `${inserted.length} ${assetLabel}`,
        summary: `Imported ${inserted.length} ${assetLabel} from a spreadsheet.${photoSummary}`,
        metadata: {
          imported: inserted.length,
          photosAttached: photos.attached,
          photosFailed: photos.failed.length,
        },
      },
      ...inserted.map((asset) => ({
        category: 'import' as const,
        action: 'Imported asset',
        source: 'import' as const,
        actorId: profile.id,
        actorLabel,
        entityType: 'Asset',
        entityId: asset.id,
        entityLabel: `${asset.name} (${asset.asset_tag})`,
        summary: 'Created via spreadsheet import.',
        metadata: { category: asset.category, location: asset.location },
      })),
    ])
    } catch (auditError) {
      console.error('[assets/import] Records imported but audit logging failed', auditError)
    }

    return Response.json({
      imported: inserted.length,
      assets: inserted,
      photos,
    })
  } catch (error) {
    console.error('[assets/import]', error)
    const message = error instanceof Error ? error.message : 'Asset import failed.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
