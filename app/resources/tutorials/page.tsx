import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ListChecks } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'
import { tutorials } from '@/lib/tutorials-data'

export const metadata: Metadata = {
  title: 'Tutorials | AssetGriffin',
  description: 'Step-by-step written walkthroughs for getting started, scanning assets, maintenance, audits, and permissions.',
}

export default function TutorialsIndexPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Resources · Tutorials"
        title="Step-by-step tutorials"
        subtitle="Written walkthroughs for the most common setup tasks — no video required, just the steps."
      />

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <div className="grid gap-5 sm:grid-cols-2">
            {tutorials.map((tutorial) => (
              <Link
                key={tutorial.slug}
                href={`/resources/tutorials/${tutorial.slug}`}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <ListChecks size={22} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground">{tutorial.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tutorial.summary}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {tutorial.steps.length} steps · ~{tutorial.minutes} min
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Start
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        headline="Ready to try it yourself?"
        subcopy="Every tutorial above takes a few minutes inside a free AssetGriffin workspace."
      />
      <MarketingFooter />
    </main>
  )
}
