import { createGroupForCurrentOrg, listGroupsWithCounts } from '@/lib/groups-db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const groups = await listGroupsWithCounts()
    return Response.json({ groups })
  } catch (error) {
    console.error('[groups/list]', error)
    const message = error instanceof Error ? error.message : 'Could not load groups.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown; icon?: unknown; slug?: unknown }
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return Response.json({ error: 'Group name is required.' }, { status: 400 })

    const group = await createGroupForCurrentOrg({
      name,
      icon: typeof body.icon === 'string' ? body.icon : undefined,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
    })

    return Response.json({ group })
  } catch (error) {
    console.error('[groups/create]', error)
    const message = error instanceof Error ? error.message : 'Could not create group.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : message.includes('duplicate') || message.includes('unique')
          ? 409
          : 500
    return Response.json({ error: message }, { status })
  }
}
