import { getCreditPack } from '@/lib/griffin-credit-packs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe'

export type CreditCheckoutVerification = {
  status: 'fulfilled' | 'paid_pending_fulfillment' | 'unpaid' | 'invalid'
  packKey?: string
  credits?: number
  creditBalance?: number
}

export async function verifyCreditCheckoutSession(
  sessionId: string,
  organizationId: string,
): Promise<CreditCheckoutVerification> {
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.metadata?.purchase_type !== 'griffin_vision_credits') {
    return { status: 'invalid' }
  }

  if (session.metadata.organization_id !== organizationId) {
    return { status: 'invalid' }
  }

  if (session.payment_status !== 'paid') {
    return { status: 'unpaid' }
  }

  const admin = createAdminClient()
  const { data: transaction, error: transactionError } = await admin
    .from('ai_credit_transactions')
    .select('pack_key, credits_delta')
    .eq('stripe_checkout_session_id', sessionId)
    .eq('transaction_type', 'purchase')
    .maybeSingle()

  if (transactionError) throw new Error(transactionError.message)

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .select('griffin_vision_credits_balance')
    .eq('id', organizationId)
    .single()

  if (organizationError) throw new Error(organizationError.message)

  const packKey = session.metadata.pack_key
  const pack = packKey ? getCreditPack(packKey) : null

  if (transaction) {
    return {
      status: 'fulfilled',
      packKey: transaction.pack_key ?? packKey,
      credits: transaction.credits_delta,
      creditBalance: organization?.griffin_vision_credits_balance,
    }
  }

  return {
    status: 'paid_pending_fulfillment',
    packKey: pack?.key ?? packKey,
    credits: pack?.credits,
    creditBalance: organization?.griffin_vision_credits_balance,
  }
}
