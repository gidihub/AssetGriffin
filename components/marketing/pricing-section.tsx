import { headers } from 'next/headers'
import { PricingCards } from '@/components/marketing/pricing-cards'

export async function PricingSection() {
  // Vercel populates this header automatically in production/preview deployments
  // based on the visitor's IP. It is absent in local dev, in which case pricing
  // falls back to standard (Tier 1) USD pricing until the visitor picks a region.
  const requestHeaders = await headers()
  const detectedCountryCode = requestHeaders.get('x-vercel-ip-country')

  return (
    <section id="pricing" className="border-b border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">Simple, asset-based pricing</p>
          <h2 className="mt-3 text-balance text-3xl tracking-tight text-foreground md:text-4xl">
            Pricing that grows with your assets, not your headcount
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            We automatically apply purchasing power parity pricing based on your location — no codes required. Just
            choose the currency you&apos;d like to see prices in.
          </p>
        </div>

        <div className="mt-12">
          <PricingCards initialCountryCode={detectedCountryCode} />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Unlike per-seat pricing, adding teammates never costs you more.
        </p>
      </div>
    </section>
  )
}
