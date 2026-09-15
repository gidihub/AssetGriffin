import { importAssetsForCurrentOrg } from '@/lib/assets-db'
import type { ImportAssetRecord } from '@/lib/griffineye-import'
import { recordAuditEvents } from '@/lib/griffineye-audit'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

function isImportRecord(value: unknown): value is ImportAssetRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.asset_tag === 'string' && typeof record.name === 'string'
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await requireUserProfile()

    const body = (await request.json()) as { records?: unknown }
    const records = Array.isArray(body.records) ? body.records.filter(isImportRecord) : []

    if (records.length === 0) {
      return Response.json({ error: 'No valid asset records to import.' }, { status: 400 })
    }

    if (records.length > 2000) {
      return Response.json({ error: 'Import batches are limited to 2,000 records.' }, { status: 400 })
    }

    const inserted = await importAssetsForCurrentOrg(records)

    // One event per imported asset, so "what changed via import?" can name the
    // records rather than only the batch. A batch summary event fronts them.
    const actorLabel = profile.full_name || profile.email
    const assetLabel = inserted.length === 1 ? 'asset' : 'assets'

    await recordAuditEvents(supabase, profile.organization_id, [
      {
        category: 'import',
        action: 'Imported spreadsheet',
        source: 'import',
        actorId: profile.id,
        actorLabel,
        entityType: 'Import batch',
        entityLabel: `${inserted.length} ${assetLabel}`,
        summary: `Imported ${inserted.length} ${assetLabel} from a spreadsheet.`,
        metadata: { imported: inserted.length },
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

    return Response.json({
      imported: inserted.length,
      assets: inserted,
    })
  } catch (error) {
    console.error('[assets/import]', error)
    const message = error instanceof Error ? error.message : 'Asset import failed.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
