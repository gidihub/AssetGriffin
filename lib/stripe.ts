import Stripe from 'stripe'

/**
 * Server-only Stripe client. Never import this from a Client Component.
 *
 * Scaffolding only — no checkout/webhook routes exist yet. Pricing cards
 * currently link straight to `/app` (see components/marketing/pricing-cards.tsx).
 * To wire up real billing you'll need:
 *   - app/api/checkout/route.ts (or a Server Action) to create a Checkout Session
 *   - app/api/webhooks/stripe/route.ts to handle `checkout.session.completed`, etc.
 *   - Price/Product IDs from your Stripe dashboard, referenced from lib/pricing-data.ts
 */
export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set — add it to .env.local')
  }
  return new Stripe(secretKey)
}
