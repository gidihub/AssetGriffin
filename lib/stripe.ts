import Stripe from 'stripe'

/**
 * Server-only Stripe client. Never import this from a Client Component.
 *
 * Credit-pack checkout and webhooks live under app/api/billing/credits and
 * app/api/webhooks/stripe. Subscription plan checkout can reuse the same client
 * and organizations.stripe_customer_id when that flow is added.
 */
let stripeClient: Stripe | null = null

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set — add it to .env.local')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }

  return stripeClient
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set — add it to .env.local')
  }
  return secret
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}
