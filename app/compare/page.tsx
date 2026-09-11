import type { Metadata } from 'next'
import { ArrowLeftRight } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { IndexCardGrid, type IndexCardGroup } from '@/components/marketing/index-card-grid'
import { compareTargets } from '@/lib/compare-data'

export const metadata: Metadata = {
  title: 'Compare Asset Tracking Software | AssetGriffin',
  description:
    'Honest, feature-by-feature comparisons of AssetGriffin against AssetTiger, Asset Panda, EZOfficeInventory, Reftab, Snipe-IT, and Sortly.',
}

const cardMeta: Record<string, string> = {
  assettiger: 'Free tier limits and search at scale',
  'asset-panda': 'Pricing model and integration depth',
  ezofficeinventory: 'Setup complexity and mobile experience',
  reftab: 'Feature depth beyond IT assets',
  'snipe-it': 'Hosted vs. self-managed tradeoffs',
  sortly: 'Search performance at scale',
}

const groups: IndexCardGroup[] = [
  {
    cards: compareTargets.map((target) => ({
      href: `/compare/${target.slug}`,
      icon: ArrowLeftRight,
      title: target.navLabel,
      description: cardMeta[target.slug] ?? 'See how we compare',
    })),
  },
]

export default function CompareIndexPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Compare"
        title="See how AssetGriffin stacks up"
        subtitle="Honest, feature-by-feature comparisons based on each competitor's current published pricing and feature pages, so you can decide with real information."
      />
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <IndexCardGrid groups={groups} />
        </div>
      </section>
      <CtaBand
        headline="Not seeing the tool you're switching from?"
        subcopy="Reach out and we'll put together an honest comparison for your specific tool."
        ctaLabel="Contact us"
        ctaHref="/contact"
      />
      <MarketingFooter />
    </main>
  )
}
