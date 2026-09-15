import Stripe from 'stripe'
import { getCreditPack } from '@/lib/griffin-credit-packs'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe'

export const runtime = 'nodejs'

async function fulfillCreditPackPurchase(session: Stripe.Checkout.Session) {
  if (session.metadata?.purchase_type !== 'griffin_vision_credits') {
    return
  }

  const organizationId = session.metadata.organization_id
  const packKey = session.metadata.pack_key
  const creditsFromMetadata = Number(session.metadata.credits)

  if (!organizationId || !packKey) {
    throw new Error('Credit checkout session is missing organization or pack metadata.')
  }

  const pack = getCreditPack(packKey)
  if (!pack) {
    throw new Error(`Unknown credit pack key: ${packKey}`)
  }

  const credits = Number.isFinite(creditsFromMetadata) && creditsFromMetadata > 0 ? creditsFromMetadata : pack.credits
  const amountCents = session.amount_total ?? pack.priceCents
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('grant_griffin_vision_credits', {
    p_organization_id: organizationId,
    p_credits: credits,
    p_pack_key: pack.key,
    p_amount_cents: amountCents,
    p_stripe_checkout_session_id: session.id,
    p_stripe_payment_intent_id: paymentIntentId,
  })

  if (error) {
    throw new Error(error.message)
  }

  console.info('[stripe/webhook] Granted GriffinEye credits', {
    organizationId,
    packKey: pack.key,
    credits,
    balanceAfter: data,
    sessionId: session.id,
  })
}

export async function POST(request: Request) {
  const stripe = getStripeClient()
  const webhookSecret = getStripeWebhookSecret()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'Missing Stripe signature.' }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error('[stripe/webhook] Signature verification failed', error)
    return Response.json({ error: 'Invalid Stripe signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status === 'paid') {
          await fulfillCreditPackPurchase(session)
        }
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await fulfillCreditPackPurchase(session)
        break
      }
      default:
        break
    }
  } catch (error) {
    console.error('[stripe/webhook] Handler failed', event.type, error)
    return Response.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return Response.json({ received: true })
}
