export type GriffinCreditPackKey = 'starter' | 'standard' | 'bulk'

export type GriffinCreditPack = {
  key: GriffinCreditPackKey
  name: string
  credits: number
  /** Display price in USD cents */
  priceCents: number
  description: string
  highlighted?: boolean
}

/** ~$0.13/credit list price; bulk packs include modest volume discounts. */
export const GRIFFIN_CREDIT_PACKS: GriffinCreditPack[] = [
  {
    key: 'starter',
    name: 'Starter',
    credits: 50,
    priceCents: 650,
    description: '50 GriffinEye photo scans',
  },
  {
    key: 'standard',
    name: 'Standard',
    credits: 200,
    priceCents: 2400,
    description: '200 GriffinEye photo scans',
    highlighted: true,
  },
  {
    key: 'bulk',
    name: 'Bulk',
    credits: 500,
    priceCents: 5500,
    description: '500 GriffinEye photo scans',
  },
]

const PACK_MAP = Object.fromEntries(GRIFFIN_CREDIT_PACKS.map((pack) => [pack.key, pack])) as Record<
  GriffinCreditPackKey,
  GriffinCreditPack
>

export function getCreditPack(key: string): GriffinCreditPack | null {
  if (key === 'starter' || key === 'standard' || key === 'bulk') {
    return PACK_MAP[key]
  }
  return null
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function getStripePriceIdForPack(key: GriffinCreditPackKey): string {
  const envMap: Record<GriffinCreditPackKey, string | undefined> = {
    starter: process.env.STRIPE_CREDIT_PACK_STARTER_PRICE_ID,
    standard: process.env.STRIPE_CREDIT_PACK_STANDARD_PRICE_ID,
    bulk: process.env.STRIPE_CREDIT_PACK_BULK_PRICE_ID,
  }

  const priceId = envMap[key]
  if (!priceId) {
    throw new Error(`STRIPE_CREDIT_PACK_${key.toUpperCase()}_PRICE_ID is not configured`)
  }
  return priceId
}
