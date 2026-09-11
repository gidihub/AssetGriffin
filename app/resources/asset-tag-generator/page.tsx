import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { AssetTagGenerator } from '@/components/marketing/asset-tag-generator'

export const metadata: Metadata = {
  title: 'Free Asset Tag Generator | AssetGriffin',
  description: 'Generate a printable asset tag with a unique code in seconds, free.',
}

export default function AssetTagGeneratorPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Resources · Free Tool"
        title="Free asset tag generator"
        subtitle="Create a printable tag with a unique asset code in seconds — no account required."
      />
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <AssetTagGenerator />
        </div>
      </section>
      <CtaBand
        headline="Want tag codes generated and tracked automatically?"
        subcopy="AssetGriffin generates unique tags for every asset you import and keeps a live record of where each one is."
      />
      <MarketingFooter />
    </main>
  )
}
