import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { RoiCalculator } from '@/components/marketing/roi-calculator'

export const metadata: Metadata = {
  title: 'ROI Calculator | AssetGriffin',
  description: 'Estimate the time and loss-prevention savings of moving off spreadsheets and onto asset tracking software.',
}

export default function RoiCalculatorPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Resources · Free Tool"
        title="ROI calculator"
        subtitle="Estimate the time savings and loss prevention of moving off spreadsheets and onto asset tracking software."
      />
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <RoiCalculator />
        </div>
      </section>
      <CtaBand
        headline="See what AssetGriffin would save your team, for real"
        subcopy="Start free and import your current asset list in minutes — no credit card required."
      />
      <MarketingFooter />
    </main>
  )
}
