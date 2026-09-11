import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SolutionTemplate } from '@/components/marketing/templates/solution-template'
import { solutions, getSolutionBySlug } from '@/lib/solutions-data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return solutions.map((solution) => ({ slug: solution.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const solution = getSolutionBySlug(slug)
  if (!solution) return {}
  return { title: solution.metaTitle, description: solution.metaDescription }
}

export default async function SolutionPage({ params }: PageProps) {
  const { slug } = await params
  const solution = getSolutionBySlug(slug)
  if (!solution) notFound()

  return (
    <main>
      <MarketingHeader />
      <SolutionTemplate
        capabilityName={solution.capabilityName}
        eyebrow={solution.eyebrow}
        intro={solution.intro}
        features={solution.features}
        audiences={solution.audiences}
        ctaHeadline={solution.ctaHeadline}
        faqs={solution.faqs}
      />
      <MarketingFooter />
    </main>
  )
}
