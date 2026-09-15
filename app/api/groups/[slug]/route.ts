import { dbRecordToAssetRecord, dbRecordToRow } from '@/lib/record-mappers'
import { deleteGroupBySlug, getGroupWithFieldsAndRecords } from '@/lib/groups-db'

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
        fields: payload.fields,
        records: rows,
        assets: payload.records.map(dbRecordToAssetRecord),
      })
    }

    return Response.json({
      group: payload.group,
      fields: payload.fields,
      records: rows,
    })
  } catch (error) {
    console.error('[groups/get]', error)
    const message = error instanceof Error ? error.message : 'Could not load group.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    if (slug === 'assets') {
      return Response.json({ error: 'The Assets group cannot be deleted.' }, { status: 400 })
    }
    await deleteGroupBySlug(slug)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[groups/delete]', error)
    const message = error instanceof Error ? error.message : 'Could not delete group.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500
    return Response.json({ error: message }, { status })
  }
}
