import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingHero } from '@/components/marketing/marketing-hero'
import { ProblemSection } from '@/components/marketing/problem-section'
import { FeatureGrid } from '@/components/marketing/feature-grid'
import { PricingSection } from '@/components/marketing/pricing-section'
import { ComparisonTeaser } from '@/components/marketing/comparison-teaser'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default function HomePage() {
  return (
    <main>
      <MarketingHeader />
      <MarketingHero />
      <ProblemSection />
      <FeatureGrid />
      <PricingSection />
      <ComparisonTeaser />
      <MarketingFooter />
    </main>
  )
}
