import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

/** Credit packs were removed in favor of monthly allowance + $0.02/scan overage on paid tiers. */
export async function POST() {
  try {
    await requireUserProfile()
    return Response.json(
      {
        error:
          'Scan packs are no longer sold. Paid plans include a monthly allowance with $0.02 per additional scan on your next invoice.',
      },
      { status: 410 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
