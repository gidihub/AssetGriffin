import { createAssetRecordForCurrentOrg, listAssetRecordsForCurrentOrg, recordToLegacyAssetShape } from '@/lib/groups-db'
import { dbRecordToAssetRecord } from '@/lib/record-mappers'
import type { AssetIntakeDraft } from '@/lib/griffineye-intake'
import { ASSET_CATEGORIES } from '@/lib/griffineye-intake'
import { recordAuditEvent } from '@/lib/griffineye-audit'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const records = await listAssetRecordsForCurrentOrg()
    return Response.json({ assets: records.map(dbRecordToAssetRecord) })
  } catch (error) {
    console.error('[assets/list]', error)
    const message = error instanceof Error ? error.message : 'Could not load assets.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}

function isIntakeDraft(value: unknown): value is AssetIntakeDraft {
  if (!value || typeof value !== 'object') return false
  const draft = value as Record<string, unknown>
  return (
    typeof draft.manufacturer === 'string' &&
    typeof draft.model === 'string' &&
    typeof draft.serialNumber === 'string' &&
    typeof draft.assetTag === 'string' &&
    typeof draft.summary === 'string' &&
    typeof draft.notes === 'string' &&
    typeof draft.category === 'string' &&
    ASSET_CATEGORIES.includes(draft.category as (typeof ASSET_CATEGORIES)[number])
  )
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await requireUserProfile()

    const body = (await request.json()) as unknown
    if (!isIntakeDraft(body)) {
      return Response.json({ error: 'Invalid asset payload.' }, { status: 400 })
    }

    const record = await createAssetRecordForCurrentOrg(body)
    const asset = recordToLegacyAssetShape(record)

    // Records created here always came through GriffinEye intake, so the source
    // marks them as AI-assisted while the event itself stays a record change.
    await recordAuditEvent(supabase, profile.organization_id, {
      category: 'record',
      action: 'Created asset',
      source: 'griffineye',
      actorId: profile.id,
      actorLabel: profile.full_name || profile.email,
      entityType: 'Asset',
      entityId: record.id,
      entityLabel: `${asset.name} (${asset.asset_tag})`,
      summary: body.summary.slice(0, 280),
      metadata: {
        category: asset.category,
        assigned_to: asset.assigned_to,
        location: asset.location,
        has_serial: Boolean(asset.serial),
      },
    })

    return Response.json({ asset, record: dbRecordToAssetRecord(record) })
  } catch (error) {
    console.error('[assets/create]', error)
    const message = error instanceof Error ? error.message : 'Asset creation failed.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
