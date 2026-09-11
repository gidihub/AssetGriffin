import type { LucideIcon } from 'lucide-react'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { FeatureCallout } from '@/components/marketing/feature-callout'
import { FaqAccordion, type FaqItem } from '@/components/marketing/faq-accordion'

export interface SolutionFeature {
  icon: LucideIcon
  title: string
  body: string
}

export interface SolutionAudience {
  title: string
  body: string
}

interface SolutionTemplateProps {
  capabilityName: string
  eyebrow: string
  intro: string
  features: SolutionFeature[]
  audiences: SolutionAudience[]
  ctaHeadline: string
  faqs: FaqItem[]
}

export function SolutionTemplate({
  capabilityName,
  eyebrow,
  intro,
  features,
  audiences,
  ctaHeadline,
  faqs,
}: SolutionTemplateProps) {
  return (
    <>
      <SubPageHero
        eyebrow={eyebrow}
        title={`${capabilityName} built for teams that need to know where things are`}
        subtitle={intro}
      />

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <FeatureCallout key={feature.title} icon={feature.icon} title={feature.title} body={feature.body} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Who this is for
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {audiences.map((audience) => (
              <div key={audience.title} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-bold text-foreground">{audience.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{audience.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand headline={ctaHeadline} />

      <FaqAccordion items={faqs} />
    </>
  )
}
