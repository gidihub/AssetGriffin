import { getGroupBySlug } from '@/lib/groups-db'
import { listActionTypesForGroup } from '@/lib/actions-db'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const group = await getGroupBySlug(slug)
    if (!group) return Response.json({ error: 'Group not found.' }, { status: 404 })

    const actionTypes = await listActionTypesForGroup(group.id)
    return Response.json({ actionTypes })
  } catch (error) {
    console.error('[groups/actions]', error)
    const message = error instanceof Error ? error.message : 'Could not load actions.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
