import { dbRecordToRow } from '@/lib/record-mappers'
import { listActionEventsForRecord, performRecordAction } from '@/lib/actions-db'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ slug: string; id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const events = await listActionEventsForRecord(id)
    return Response.json({ events })
  } catch (error) {
    console.error('[groups/records/actions/list]', error)
    const message = error instanceof Error ? error.message : 'Could not load action history.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug, id } = await context.params
    const body = (await request.json()) as {
      actionTypeId?: string
      values?: Record<string, unknown>
      notes?: string
    }

    if (!body.actionTypeId?.trim()) {
      return Response.json({ error: 'actionTypeId is required.' }, { status: 400 })
    }

    const result = await performRecordAction({
      slug,
      recordId: id,
      actionTypeId: body.actionTypeId,
      values: body.values,
      notes: body.notes,
    })

    return Response.json({
      record: dbRecordToRow(result.record),
      actionName: result.actionName,
      eventId: result.event.id,
    })
  } catch (error) {
    console.error('[groups/records/actions/perform]', error)
    const message = error instanceof Error ? error.message : 'Could not perform action.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : message === 'Record not found.' || message === 'Action type not found.'
          ? 404
          : 500
    return Response.json({ error: message }, { status })
  }
}
