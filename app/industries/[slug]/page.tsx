import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { IndustryTemplate } from '@/components/marketing/templates/industry-template'
import { industries, getIndustryBySlug } from '@/lib/industries-data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return industries.map((industry) => ({ slug: industry.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const industry = getIndustryBySlug(slug)
  if (!industry) return {}
  return { title: industry.metaTitle, description: industry.metaDescription }
}

export default async function IndustryPage({ params }: PageProps) {
  const { slug } = await params
  const industry = getIndustryBySlug(slug)
  if (!industry) notFound()

  return (
    <main>
      <MarketingHeader />
      <IndustryTemplate
        industryName={industry.industryName}
        navLabel={industry.navLabel}
        eyebrow={`By industry · ${industry.navLabel}`}
        intro={industry.intro}
        features={industry.features}
        useCase={industry.useCase}
        ctaHeadline={`Start tracking your ${industry.ctaNoun} free`}
        faqs={industry.faqs}
      />
      <MarketingFooter />
    </main>
  )
}
