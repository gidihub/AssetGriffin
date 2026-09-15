import { getCreditPack, getStripePriceIdForPack, type GriffinCreditPackKey } from '@/lib/griffin-credit-packs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl, getStripeClient } from '@/lib/stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

type OrganizationBillingRow = {
  id: string
  name: string
  stripe_customer_id: string | null
}

export async function createCreditPackCheckoutSession({
  supabase,
  organizationId,
  userEmail,
  packKey,
}: {
  supabase: SupabaseClient
  organizationId: string
  userEmail: string
  packKey: GriffinCreditPackKey
}) {
  const pack = getCreditPack(packKey)
  if (!pack) {
    throw new Error('Invalid credit pack.')
  }

  const stripe = getStripeClient()
  const priceId = getStripePriceIdForPack(packKey)
  const siteUrl = getSiteUrl()

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, name, stripe_customer_id')
    .eq('id', organizationId)
    .single()

  if (error || !organization) {
    throw new Error('Organization not found.')
  }

  const org = organization as OrganizationBillingRow
  let customerId = org.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create(
      {
        email: userEmail,
        name: org.name,
        metadata: {
          organization_id: organizationId,
        },
      },
      {
        idempotencyKey: `org-customer-${organizationId}`,
      },
    )
    customerId = customer.id

    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', organizationId)
      .is('stripe_customer_id', null)

    if (updateError) {
      throw new Error(updateError.message)
    }

    const { data: refreshedOrg, error: refreshError } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', organizationId)
      .single()

    if (refreshError) {
      throw new Error(refreshError.message)
    }

    customerId = refreshedOrg?.stripe_customer_id ?? customerId
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/app?settings=Billing&checkoutSessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/app?settings=Billing&creditPurchase=cancelled`,
    metadata: {
      purchase_type: 'griffin_vision_credits',
      organization_id: organizationId,
      pack_key: pack.key,
      credits: String(pack.credits),
    },
    payment_intent_data: {
      metadata: {
        purchase_type: 'griffin_vision_credits',
        organization_id: organizationId,
        pack_key: pack.key,
        credits: String(pack.credits),
      },
    },
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return { url: session.url, sessionId: session.id }
}
