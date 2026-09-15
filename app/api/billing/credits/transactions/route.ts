import { getCreditPurchaseHistory } from '@/lib/griffin-credits'
import { getCreditBalance } from '@/lib/griffin-vision-usage'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { supabase, profile } = await requireUserProfile()
    const [creditBalance, purchases] = await Promise.all([
      getCreditBalance(supabase, profile.organization_id),
      getCreditPurchaseHistory(supabase, profile.organization_id),
    ])

    return Response.json({ creditBalance, purchases })
  } catch (error) {
    console.error('[billing/credits/transactions]', error)
    const message = error instanceof Error ? error.message : 'Could not load credit history.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
