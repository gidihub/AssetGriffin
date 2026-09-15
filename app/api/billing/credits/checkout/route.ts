import { createCreditPackCheckoutSession } from '@/lib/griffin-credit-checkout'
import type { GriffinCreditPackKey } from '@/lib/griffin-credit-packs'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

function parsePackKey(value: unknown): GriffinCreditPackKey | null {
  if (value === 'starter' || value === 'standard' || value === 'bulk') return value
  return null
}

export async function POST(request: Request) {
  try {
    const { supabase, profile, user } = await requireUserProfile()
    const body = (await request.json()) as { packKey?: unknown }
    const packKey = parsePackKey(body.packKey)

    if (!packKey) {
      return Response.json({ error: 'Select a valid credit pack.' }, { status: 400 })
    }

    const checkout = await createCreditPackCheckoutSession({
      supabase,
      organizationId: profile.organization_id,
      userEmail: profile.email || user.email || '',
      packKey,
    })

    return Response.json(checkout)
  } catch (error) {
    console.error('[billing/credits/checkout]', error)
    const message = error instanceof Error ? error.message : 'Could not start checkout.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : message.includes('STRIPE_') || message.includes('is not configured')
          ? 503
          : 500
    return Response.json({ error: message }, { status })
  }
}
