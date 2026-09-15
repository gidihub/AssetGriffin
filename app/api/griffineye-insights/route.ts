import { buildLiveObservations } from '@/lib/griffineye-agent/insights'
import { computeDataGaps } from '@/lib/griffineye-agent/tools'
import { assertGriffinEyeAccess } from '@/lib/griffineye-security/access-guard'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { supabase, profile } = await requireUserProfile()

    const access = await assertGriffinEyeAccess(supabase, profile, { endpoint: 'griffineye-insights' })
    if (!access.ok) {
      return Response.json({ error: access.error, code: access.code }, { status: access.status })
    }

    const ctx = { supabase, organizationId: profile.organization_id }

    const [observations, gaps] = await Promise.all([buildLiveObservations(ctx), computeDataGaps(ctx)])

    return Response.json({
      observations,
      dataHealth: gaps.filter((gap) => gap.missing > 0),
      totalAssets: gaps[0]?.total ?? 0,
    })
  } catch (error) {
    console.error('[griffineye-insights]', error)
    const message = error instanceof Error ? error.message : 'Could not load GriffinEye observations.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
