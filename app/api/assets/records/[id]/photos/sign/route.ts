import { signAssetPhotoPaths } from '@/lib/asset-photo-storage'
import { getGroupBySlug } from '@/lib/groups-db'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const { supabase, profile } = await requireUserProfile()
    const { id: recordId } = await context.params

    const group = await getGroupBySlug('assets')
    if (!group) return Response.json({ error: 'Assets group not found.' }, { status: 404 })

    const { data: record, error } = await supabase
      .from('records')
      .select('id')
      .eq('id', recordId)
      .eq('group_id', group.id)
      .eq('organization_id', profile.organization_id)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!record) return Response.json({ error: 'Asset not found.' }, { status: 404 })

    const body = (await request.json()) as { paths?: unknown }
    if (!Array.isArray(body.paths)) {
      return Response.json({ error: 'paths array is required.' }, { status: 400 })
    }

    const prefix = `${profile.organization_id}/${recordId}/`
    const paths = body.paths
      .filter((path): path is string => typeof path === 'string' && path.startsWith(prefix))
      .slice(0, 8)

    const urls = await signAssetPhotoPaths(supabase, paths)
    return Response.json({ urls })
  } catch (error) {
    console.error('[assets/photos/sign]', error)
    const message = error instanceof Error ? error.message : 'Could not sign photo URLs.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
