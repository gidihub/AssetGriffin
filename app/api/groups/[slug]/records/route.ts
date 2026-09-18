import { dbRecordToAssetRecord, dbRecordToRow } from '@/lib/record-mappers'
import { createRecordForGroup, getGroupBySlug, getGroupWithFieldsAndRecords } from '@/lib/groups-db'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const payload = await getGroupWithFieldsAndRecords(slug)
    if (!payload) return Response.json({ error: 'Group not found.' }, { status: 404 })

    const rows = payload.records.map(dbRecordToRow)

    if (slug === 'assets') {
      return Response.json({
        group: payload.group,
        records: rows,
        assets: payload.records.map(dbRecordToAssetRecord),
      })
    }

    return Response.json({ group: payload.group, records: rows })
  } catch (error) {
    console.error('[groups/records/list]', error)
    const message = error instanceof Error ? error.message : 'Could not load records.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireUserProfile()
    const { slug } = await context.params
    const group = await getGroupBySlug(slug)
    if (!group) return Response.json({ error: 'Group not found.' }, { status: 404 })

    const body = (await request.json()) as { data?: unknown }
    if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
      return Response.json({ error: 'Record data is required.' }, { status: 400 })
    }

    const record = await createRecordForGroup(group.id, body.data as Record<string, unknown>, profile.id)

    return Response.json({ record: dbRecordToRow(record) })
  } catch (error) {
    console.error('[groups/records/create]', error)
    const message = error instanceof Error ? error.message : 'Could not create record.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
