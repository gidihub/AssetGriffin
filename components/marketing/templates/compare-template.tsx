import { CtaBand } from '@/components/marketing/cta-band'
import { ComparisonTable, type ComparisonRow } from '@/components/marketing/comparison-table'
import { TestimonialPlaceholder } from '@/components/marketing/testimonial-placeholder'
import { FaqAccordion, type FaqItem } from '@/components/marketing/faq-accordion'

interface CompareTemplateProps {
  competitorName: string
  intro: string
  rows: ComparisonRow[]
  doesWellHeadline: string
  doesWellBody: string
  looksElsewhereHeadline: string
  looksElsewhereBody: string
  pricingCallout: string
  isPlaceholder?: boolean
  faqs: FaqItem[]
}

export function CompareTemplate({
  competitorName,
  intro,
  rows,
  doesWellHeadline,
  doesWellBody,
  looksElsewhereHeadline,
  looksElsewhereBody,
  pricingCallout,
  isPlaceholder,
  faqs,
}: CompareTemplateProps) {
  return (
    <>
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Comparison</p>
          <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
            AssetGriffin vs {competitorName}: which is right for you in 2026?
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">{intro}</p>
          {isPlaceholder && (
            <p className="mt-4 inline-block rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
              [TODO: research and fill] — this page is a shell pending verified competitor research
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <ComparisonTable competitorName={competitorName} rows={rows} />
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Figures reflect publicly available product information as of 2026 and are updated periodically. Pricing
            and feature sets change — always confirm current details on the vendor&apos;s site before deciding.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 md:grid-cols-2 md:py-20">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">{doesWellHeadline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{doesWellBody}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">{looksElsewhereHeadline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{looksElsewhereBody}</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <div className="rounded-2xl border border-primary/20 bg-accent p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-accent-foreground">Pricing at a glance</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">{pricingCallout}</p>
          </div>
          <div className="mt-6">
            <TestimonialPlaceholder />
          </div>
        </div>
      </section>

      <CtaBand headline="Ready to see the difference?" />

      <FaqAccordion items={faqs} />
    </>
  )
}
