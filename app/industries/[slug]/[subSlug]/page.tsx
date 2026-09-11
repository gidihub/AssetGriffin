import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { FlagshipVerticalTemplate } from '@/components/marketing/templates/flagship-vertical-template'
import { SubVerticalTemplate } from '@/components/marketing/templates/sub-vertical-template'
import { subVerticals, getSubVertical } from '@/lib/sub-verticals-data'

interface PageProps {
  params: Promise<{ slug: string; subSlug: string }>
}

export function generateStaticParams() {
  return subVerticals.map((entry) => ({ slug: entry.group, subSlug: entry.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, subSlug } = await params
  const entry = getSubVertical(slug, subSlug)
  if (!entry) return {}
  return { title: entry.metaTitle, description: entry.metaDescription }
}

export default async function SubVerticalPage({ params }: PageProps) {
  const { slug, subSlug } = await params
  const entry = getSubVertical(slug, subSlug)
  if (!entry) notFound()

  return (
    <main>
      <MarketingHeader />
      {entry.template === 'flagship' ? (
        <FlagshipVerticalTemplate
          eyebrow={entry.eyebrow}
          headline={entry.headline}
          subhead={entry.subhead}
          parentLabel={entry.parentLabel}
          parentHref={entry.parentHref}
          navLabel={entry.navLabel}
          statusCards={entry.statusCards}
          challengeBullets={entry.challengeBullets}
          challengeBody={entry.challengeBody}
          solutionSections={entry.solutionSections}
          solutionPreviews={entry.solutionPreviews}
          flexiblePreviewScreen={entry.flexiblePreviewScreen}
          flexiblePoints={entry.flexiblePoints}
          faqs={entry.faqs}
          ctaHeadline={entry.ctaHeadline}
        />
      ) : (
        <SubVerticalTemplate
          eyebrow={entry.eyebrow}
          title={entry.title}
          subtitle={entry.subtitle}
          parentLabel={entry.parentLabel}
          parentHref={entry.parentHref}
          navLabel={entry.navLabel}
          hookParagraphs={entry.hookParagraphs}
          heroPreviewScreen={entry.heroPreviewScreen}
          heroPreviewCaption={entry.heroPreviewCaption}
          capabilitySections={entry.capabilitySections}
          faqs={entry.faqs}
          ctaHeadline={entry.ctaHeadline}
        />
      )}
      <MarketingFooter />
    </main>
  )
}
