import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { DepreciationCalculator } from '@/components/marketing/depreciation-calculator'

export const metadata: Metadata = {
  title: 'Free Asset Depreciation Calculator | AssetGriffin',
  description: 'Calculate straight-line depreciation for any asset and see a full year-by-year schedule, free.',
}

export default function DepreciationCalculatorPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Resources · Free Tool"
        title="Asset depreciation calculator"
        subtitle="Estimate straight-line depreciation for any asset and see the full year-by-year schedule instantly."
      />
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <DepreciationCalculator />
        </div>
      </section>
      <CtaBand
        headline="Want AssetGriffin to calculate this automatically for every asset you own?"
        subcopy="AssetGriffin tracks depreciation for your whole inventory and generates the report for you — no spreadsheet required."
      />
      <MarketingFooter />
    </main>
  )
}
