import { getGroupBySlug, listFieldsForGroup, replaceFieldsForGroup, type UpsertFieldInput } from '@/lib/groups-db'
import { FIELD_TYPES } from '@/lib/schema-types'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ slug: string }> }

function isFieldInput(value: unknown): value is UpsertFieldInput {
  if (!value || typeof value !== 'object') return false
  const field = value as Record<string, unknown>
  if (field.id !== undefined && typeof field.id !== 'string') return false
  return (
    typeof field.key === 'string' &&
    typeof field.label === 'string' &&
    typeof field.type === 'string' &&
    FIELD_TYPES.includes(field.type as (typeof FIELD_TYPES)[number]) &&
    typeof field.sort_order === 'number'
  )
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const group = await getGroupBySlug(slug)
    if (!group) return Response.json({ error: 'Group not found.' }, { status: 404 })

    const fields = await listFieldsForGroup(group.id)
    return Response.json({ group, fields })
  } catch (error) {
    console.error('[groups/fields/list]', error)
    const message = error instanceof Error ? error.message : 'Could not load fields.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const group = await getGroupBySlug(slug)
    if (!group) return Response.json({ error: 'Group not found.' }, { status: 404 })

    const body = (await request.json()) as { fields?: unknown }
    const rawFields = Array.isArray(body.fields) ? body.fields : []
    if (rawFields.length === 0) {
      return Response.json({ error: 'At least one valid field definition is required.' }, { status: 400 })
    }
    if (!rawFields.every(isFieldInput)) {
      return Response.json({ error: 'Every field definition must be valid.' }, { status: 400 })
    }
    const fields = rawFields

    const updated = await replaceFieldsForGroup(group.id, fields)
    return Response.json({ group, fields: updated })
  } catch (error) {
    console.error('[groups/fields/replace]', error)
    const message = error instanceof Error ? error.message : 'Could not save fields.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
