import Link from 'next/link'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CtaBand } from '@/components/marketing/cta-band'
import { FaqAccordion, type FaqItem } from '@/components/marketing/faq-accordion'
import { TestimonialPlaceholder } from '@/components/marketing/testimonial-placeholder'
import { ProductPreview, type ProductPreviewScreen } from '@/components/marketing/product-preview'
import { StatusBadge } from '@/components/workspace/primitives'

export interface StatusCard {
  item: string
  status: string
}

export interface SolutionSection {
  heading: string
  bullets: string[]
}

export interface SolutionPreview {
  screen: ProductPreviewScreen
  caption?: string
}

export interface FlexiblePoint {
  label: string
  body: string
}

interface FlagshipVerticalTemplateProps {
  eyebrow: string
  headline: string
  subhead: string
  parentLabel: string
  parentHref: string
  navLabel: string
  statusCards: StatusCard[]
  challengeBullets: string[]
  challengeBody: string
  solutionSections: SolutionSection[]
  solutionPreviews: SolutionPreview[]
  flexiblePreviewScreen: ProductPreviewScreen
  flexiblePoints: FlexiblePoint[]
  faqs: FaqItem[]
  ctaHeadline: string
}

export function FlagshipVerticalTemplate({
  eyebrow,
  headline,
  subhead,
  parentLabel,
  parentHref,
  navLabel,
  statusCards,
  challengeBullets,
  challengeBody,
  solutionSections,
  solutionPreviews,
  flexiblePreviewScreen,
  flexiblePoints,
  faqs,
  ctaHeadline,
}: FlagshipVerticalTemplateProps) {
  return (
    <>
      {/* 1. Hero with live status card cluster */}
      <section className="relative overflow-hidden border-b border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/industries" className="hover:text-foreground">
              Industries
            </Link>
            <ChevronRight size={12} />
            <Link href={parentHref} className="hover:text-foreground">
              {parentLabel}
            </Link>
            <ChevronRight size={12} />
            <span className="font-semibold text-foreground">{navLabel}</span>
          </div>
          <div className="mt-8 grid gap-12 md:grid-cols-[1.15fr_1fr] md:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
              <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
                {headline}
              </h1>
              <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">{subhead}</p>
              <Button
                render={<Link href="/app" />}
                nativeButton={false}
                size="lg"
                className="mt-8 h-12 rounded-lg px-6 text-[15px] font-semibold"
              >
                Start free — import your assets in minutes <ArrowUpRight size={18} />
              </Button>
            </div>
            <div className="grid gap-3">
              {statusCards.map((card, index) => (
                <div
                  key={card.item}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                  style={{ marginLeft: index % 2 === 1 ? '1.5rem' : 0 }}
                >
                  <span className="text-sm font-semibold text-foreground">{card.item}</span>
                  <StatusBadge status={card.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. The challenge */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            The challenge
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {challengeBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold text-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                {bullet}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-pretty text-sm leading-relaxed text-muted-foreground">{challengeBody}</p>
        </div>
      </section>

      {/* 3. The solution */}
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            The solution
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {solutionSections.map((section) => (
              <div key={section.heading} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-7">
                <h3 className="text-base font-bold text-foreground">{section.heading}</h3>
                <ul className="flex flex-col gap-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {solutionPreviews.length > 0 && (
            <div className={`mt-8 grid gap-6 ${solutionPreviews.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {solutionPreviews.map((preview) => (
                <ProductPreview key={preview.screen} screen={preview.screen} caption={preview.caption} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Flexible by design */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Flexible by design
          </h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <ProductPreview screen={flexiblePreviewScreen} />
            <ul className="flex flex-col gap-5">
              {flexiblePoints.map((point) => (
                <li key={point.label}>
                  <strong className="text-sm font-bold text-foreground">{point.label}</strong>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Testimonial placeholder */}
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <TestimonialPlaceholder />
        </div>
      </section>

      {/* 6. FAQ */}
      <FaqAccordion items={faqs} title={`${navLabel} FAQ`} />

      {/* 7. Final CTA */}
      <CtaBand headline={ctaHeadline} />
    </>
  )
}
