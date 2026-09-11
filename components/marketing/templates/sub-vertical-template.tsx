import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { ComparisonTable } from '@/components/marketing/comparison-table'
import { FaqAccordion, type FaqItem } from '@/components/marketing/faq-accordion'
import { ProductPreview, type ProductPreviewScreen } from '@/components/marketing/product-preview'
import { spreadsheetComparisonRows } from '@/lib/industries-data'

export interface FunctionalCapabilitySection {
  heading: string
  body: string
  previewScreen: ProductPreviewScreen
  previewCaption?: string
}

interface SubVerticalTemplateProps {
  eyebrow: string
  title: string
  subtitle: string
  parentLabel: string
  parentHref: string
  hookParagraphs: string[]
  heroPreviewScreen: ProductPreviewScreen
  heroPreviewCaption?: string
  capabilitySections: FunctionalCapabilitySection[]
  faqs: FaqItem[]
  ctaHeadline: string
  navLabel: string
}

export function SubVerticalTemplate({
  eyebrow,
  title,
  subtitle,
  parentLabel,
  parentHref,
  hookParagraphs,
  heroPreviewScreen,
  heroPreviewCaption,
  capabilitySections,
  faqs,
  ctaHeadline,
  navLabel,
}: SubVerticalTemplateProps) {
  return (
    <>
      <SubPageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <div className="border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-6 py-3 text-xs text-muted-foreground">
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
      </div>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
          <div className="flex flex-col gap-4">
            {hookParagraphs.map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? 'text-pretty text-lg font-semibold leading-relaxed text-foreground'
                    : 'text-pretty text-sm leading-relaxed text-muted-foreground'
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
          <ProductPreview screen={heroPreviewScreen} caption={heroPreviewCaption} />
        </div>
      </section>

      {capabilitySections.map((section, index) => (
        <section
          key={section.heading}
          className={`border-b border-border ${index % 2 === 1 ? 'bg-secondary' : 'bg-background'}`}
        >
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className={`grid gap-10 md:grid-cols-2 ${index % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div className="flex flex-col justify-center gap-3">
                <h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                  {section.heading}
                </h2>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </div>
              <ProductPreview screen={section.previewScreen} caption={section.previewCaption} />
            </div>
          </div>
        </section>
      ))}

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            AssetGriffin vs. spreadsheets and manual tracking
          </h2>
          <div className="mt-6">
            <ComparisonTable competitorName="Spreadsheets" rows={spreadsheetComparisonRows} />
          </div>
        </div>
      </section>

      <CtaBand headline={ctaHeadline} />

      <FaqAccordion items={faqs} title={`${navLabel} FAQ`} />
    </>
  )
}
