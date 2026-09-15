import type { LucideIcon } from 'lucide-react'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { FeatureCallout } from '@/components/marketing/feature-callout'
import { UseCasePanel } from '@/components/marketing/use-case-panel'
import { FaqAccordion, type FaqItem } from '@/components/marketing/faq-accordion'
import { ComparisonTable } from '@/components/marketing/comparison-table'
import { spreadsheetComparisonRows } from '@/lib/industries-data'

export interface IndustryFeature {
  icon: LucideIcon
  title: string
  body: string
}

interface IndustryTemplateProps {
  industryName: string
  navLabel: string
  eyebrow: string
  intro: string
  features: IndustryFeature[]
  useCase: { title: string; body: string }
  ctaHeadline: string
  faqs: FaqItem[]
}

export function IndustryTemplate({
  industryName,
  navLabel,
  eyebrow,
  intro,
  features,
  useCase,
  ctaHeadline,
  faqs,
}: IndustryTemplateProps) {
  return (
    <>
      <SubPageHero eyebrow={eyebrow} title={`Asset tracking software for ${industryName}`} subtitle={intro} />

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="text-balance text-2xl tracking-tight text-foreground md:text-3xl">
            Built for how {industryName} actually work
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <FeatureCallout key={feature.title} icon={feature.icon} title={feature.title} body={feature.body} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <h2 className="text-balance text-2xl tracking-tight text-foreground md:text-3xl">
            AssetGriffin vs. spreadsheets and manual tracking
          </h2>
          <div className="mt-6">
            <ComparisonTable competitorName="Spreadsheets" rows={spreadsheetComparisonRows} />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <h2 className="text-balance text-2xl tracking-tight text-foreground md:text-3xl">
            How this looks in practice
          </h2>
          <div className="mt-6">
            <UseCasePanel title={useCase.title} body={useCase.body} />
          </div>
        </div>
      </section>

      <CtaBand headline={ctaHeadline} />

      <FaqAccordion items={faqs} title={`${navLabel} FAQ`} />
    </>
  )
}
