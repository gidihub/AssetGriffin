import { dbRecordToRow } from '@/lib/record-mappers'
import { deleteRecordForGroup, getGroupBySlug, updateRecordForGroup } from '@/lib/groups-db'
import { isRecordNotFoundError } from '@/lib/record-not-found'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ slug: string; id: string }> }

function statusForRecordError(error: unknown): number {
  const message = error instanceof Error ? error.message : ''
  if (message === 'Unauthorized' || message === 'Profile not found for authenticated user') return 401
  if (isRecordNotFoundError(error)) return 404
  return 500
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { slug, id } = await context.params
    const group = await getGroupBySlug(slug)
    if (!group) return Response.json({ error: 'Group not found.' }, { status: 404 })

    const body = (await request.json()) as { data?: unknown }
    if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
      return Response.json({ error: 'Record data is required.' }, { status: 400 })
    }

    const record = await updateRecordForGroup(group.id, id, body.data as Record<string, unknown>)
    return Response.json({ record: dbRecordToRow(record) })
  } catch (error) {
    console.error('[groups/records/update]', error)
    const message = error instanceof Error ? error.message : 'Could not update record.'
    return Response.json({ error: message }, { status: statusForRecordError(error) })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { slug, id } = await context.params
    const group = await getGroupBySlug(slug)
    if (!group) return Response.json({ error: 'Group not found.' }, { status: 404 })

    await deleteRecordForGroup(group.id, id)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[groups/records/delete]', error)
    const message = error instanceof Error ? error.message : 'Could not delete record.'
    return Response.json({ error: message }, { status: statusForRecordError(error) })
  }
}
