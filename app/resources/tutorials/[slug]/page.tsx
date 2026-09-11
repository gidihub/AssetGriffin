import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { CtaBand } from '@/components/marketing/cta-band'
import { tutorials, getTutorial } from '@/lib/tutorials-data'

export function generateStaticParams() {
  return tutorials.map((tutorial) => ({ slug: tutorial.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tutorial = getTutorial(slug)
  if (!tutorial) return {}
  return {
    title: `${tutorial.title} | AssetGriffin Tutorials`,
    description: tutorial.summary,
  }
}

export default async function TutorialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tutorial = getTutorial(slug)
  if (!tutorial) notFound()

  return (
    <main>
      <MarketingHeader />

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <Link
            href="/resources/tutorials"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft size={15} />
            Back to tutorials
          </Link>
          <h1 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {tutorial.title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{tutorial.summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {tutorial.steps.length} steps · ~{tutorial.minutes} min
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <ol className="flex flex-col gap-8">
            {tutorial.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground">{step.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand
        headline="Ready to try it yourself?"
        subcopy="This walkthrough takes just a few minutes inside a free AssetGriffin workspace."
      />
      <MarketingFooter />
    </main>
  )
}
