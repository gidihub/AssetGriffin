import { CtaBand } from '@/components/marketing/cta-band'
import { ComparisonTable, type ComparisonRow } from '@/components/marketing/comparison-table'
import { BetaInvite } from '@/components/marketing/beta-invite'
import { FaqAccordion, type FaqItem } from '@/components/marketing/faq-accordion'

interface CompareTemplateProps {
  competitorName: string
  /** Table column label when it differs from the H1 competitor name (e.g. Snipe-IT self-hosted). */
  comparisonCompetitorLabel?: string
  intro: string
  rows: ComparisonRow[]
  extraColumnHeader?: string
  doesWellHeadline: string
  doesWellBody: string
  looksElsewhereHeadline: string
  looksElsewhereBody: string
  unverifiedBody?: string
  pricingCallout?: string
  lastVerified: string
  finalCtaLabel: string
  isPlaceholder?: boolean
  faqs: FaqItem[]
}

export function CompareTemplate({
  competitorName,
  comparisonCompetitorLabel,
  intro,
  rows,
  doesWellHeadline,
  doesWellBody,
  looksElsewhereHeadline,
  looksElsewhereBody,
  extraColumnHeader,
  unverifiedBody,
  pricingCallout,
  lastVerified,
  finalCtaLabel,
  isPlaceholder,
  faqs,
}: CompareTemplateProps) {
  return (
    <>
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">Comparison</p>
          <h1 className="mt-4 text-balance text-3xl font-normal leading-tight tracking-tight text-foreground md:text-4xl">
            AssetGriffin vs {competitorName}: which is right for you in 2026?
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">{intro}</p>
          {isPlaceholder && (
            <p className="mt-4 inline-block rounded-full border border-border bg-card px-4 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              [TODO: research and fill] — this page is a shell pending verified competitor research
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-4xl gap-8 px-6 py-16 md:grid-cols-2 md:py-20">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg text-foreground">{doesWellHeadline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{doesWellBody}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg text-foreground">{looksElsewhereHeadline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{looksElsewhereBody}</p>
          </div>
        </div>
      </section>

      {unverifiedBody ? (
        <section className="border-b border-border bg-secondary">
          <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
            <div className="rounded-2xl border border-dashed border-border bg-card p-6">
              <h2 className="text-lg text-foreground">What we could not verify</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{unverifiedBody}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <ComparisonTable
            competitorName={comparisonCompetitorLabel ?? competitorName}
            rows={rows}
            extraColumnHeader={extraColumnHeader}
          />
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Figures reflect publicly available product information and are updated periodically. Pricing and feature
            sets change — always confirm current details on the vendor&apos;s site before deciding.
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Last verified: {lastVerified}
          </p>
        </div>
      </section>

      {pricingCallout ? (
        <section className="border-b border-border bg-secondary">
          <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
            <div className="rounded-2xl border border-primary/20 bg-accent p-6">
              <h2 className="text-sm uppercase tracking-wide text-accent-foreground">Pricing at a glance</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">{pricingCallout}</p>
            </div>
            <div className="mt-6">
              <BetaInvite />
            </div>
          </div>
        </section>
      ) : (
        <section className="border-b border-border bg-secondary">
          <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
            <BetaInvite />
          </div>
        </section>
      )}

      <CtaBand headline="Ready to see the difference?" ctaLabel={finalCtaLabel} />

      {faqs.length > 0 ? <FaqAccordion items={faqs} /> : null}
    </>
  )
}
