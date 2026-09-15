import { getVisionUsageSnapshot } from '@/lib/griffin-vision-usage'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { supabase, profile } = await requireUserProfile()
    const usage = await getVisionUsageSnapshot(supabase, profile.organization_id)

    return Response.json(usage)
  } catch (error) {
    console.error('[griffin-vision/usage]', error)
    const message = error instanceof Error ? error.message : 'Could not load GriffinEye usage.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
