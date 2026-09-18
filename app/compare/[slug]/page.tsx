import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { CompareTemplate } from '@/components/marketing/templates/compare-template'
import { compareTargets, getCompareBySlug } from '@/lib/compare-data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return compareTargets.map((target) => ({ slug: target.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const target = getCompareBySlug(slug)
  if (!target) return {}
  return { title: target.metaTitle, description: target.metaDescription }
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params
  const target = getCompareBySlug(slug)
  if (!target) notFound()

  return (
    <main>
      <MarketingHeader />
      <CompareTemplate
        competitorName={target.competitorName}
        comparisonCompetitorLabel={target.comparisonCompetitorLabel}
        extraColumnHeader={target.extraColumnHeader}
        intro={target.intro}
        rows={target.rows}
        doesWellHeadline={target.doesWellHeadline}
        doesWellBody={target.doesWellBody}
        looksElsewhereHeadline={target.looksElsewhereHeadline}
        looksElsewhereBody={target.looksElsewhereBody}
        unverifiedBody={target.unverifiedBody}
        pricingCallout={target.pricingCallout}
        lastVerified={target.lastVerified}
        finalCtaLabel={target.finalCtaLabel}
        isPlaceholder={target.isPlaceholder}
        faqs={target.faqs}
      />
      <MarketingFooter />
    </main>
  )
}
