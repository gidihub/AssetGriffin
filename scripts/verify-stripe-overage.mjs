#!/usr/bin/env node
/**
 * Verifies STRIPE_SECRET_KEY and creates a test-mode invoice item for GriffinEye overage.
 * Usage: node --env-file=.env.local scripts/verify-stripe-overage.mjs [stripe_customer_id]
 */
import Stripe from 'stripe'

const customerId = process.argv[2] ?? process.env.STRIPE_OVERAGE_TEST_CUSTOMER_ID
const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  console.error('STRIPE_SECRET_KEY is not set — add it to .env.local before enabling overage billing.')
  process.exit(1)
}

if (!secretKey.startsWith('sk_test_')) {
  console.error('STRIPE_SECRET_KEY must be a test-mode key (sk_test_...) — live keys are not allowed in this script.')
  process.exit(1)
}

if (!customerId) {
  console.error(
    'Pass a Stripe test customer id: node --env-file=.env.local scripts/verify-stripe-overage.mjs cus_...',
  )
  process.exit(1)
}

const stripe = new Stripe(secretKey)

const item = await stripe.invoiceItems.create({
  customer: customerId,
  amount: 2,
  currency: 'usd',
  description: 'GriffinEye overage verification · 1 scan @ $0.02/scan',
  metadata: { purchase_type: 'griffineye_overage_verify' },
})

console.log('Created test invoice item:', item.id)
console.log('Amount (cents):', item.amount)
console.log('Customer:', item.customer)
console.log('This item will appear on the customer\'s next Stripe invoice in test mode.')
