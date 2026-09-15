import { verifyCreditCheckoutSession } from '@/lib/griffin-credit-verify'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { profile } = await requireUserProfile()
    const sessionId = new URL(request.url).searchParams.get('session_id')

    if (!sessionId) {
      return Response.json({ error: 'Missing checkout session id.' }, { status: 400 })
    }

    const verification = await verifyCreditCheckoutSession(sessionId, profile.organization_id)
    return Response.json(verification)
  } catch (error) {
    console.error('[billing/credits/verify]', error)
    const message = error instanceof Error ? error.message : 'Could not verify checkout.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
