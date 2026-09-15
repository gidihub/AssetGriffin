import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'

export const metadata: Metadata = {
  title: 'The Complete Guide to Asset Management | AssetGriffin',
  description: 'A practical guide to building an asset register, choosing a tracking method, and setting up maintenance and audits.',
}

const sections = [
  {
    id: 'what-is',
    title: '1. What is asset management?',
    body: 'Asset management is the practice of tracking physical assets — equipment, vehicles, devices, furniture — through their full lifecycle: acquisition, deployment, maintenance, and eventual disposal. Done well, it answers three questions at any moment: what do we own, where is it, and what condition is it in.',
  },
  {
    id: 'register',
    title: '2. Building your asset register',
    body: 'Start with a single source of truth. List every asset with a unique identifier, purchase date, cost, category, and current location or custodian. Avoid splitting this across multiple spreadsheets by department — fragmentation is the most common reason asset registers fall out of date. Assign a tag (a printed label with a unique code) to each physical item so it can be identified without relying on a description alone.',
  },
  {
    id: 'method',
    title: '3. Choosing a tracking method',
    body: 'Spreadsheets work for a few dozen assets tracked by one person. Past that, most teams move to dedicated software because spreadsheets don\'t enforce unique IDs, don\'t log history automatically, and become slow to search as row counts grow. Look for software that supports mobile scanning, so updates happen at the point of use rather than after the fact from memory.',
  },
  {
    id: 'maintenance',
    title: '4. Setting up preventive maintenance',
    body: 'Preventive maintenance means servicing equipment on a schedule, before it fails — by calendar time, usage hours, or a meter reading. This is consistently cheaper than reactive maintenance, which happens after a breakdown and often costs more in downtime and expedited repairs than the maintenance itself would have. Build a maintenance schedule for every asset type that has a manufacturer-recommended service interval.',
  },
  {
    id: 'audits',
    title: '5. Running effective audits',
    body: 'A physical audit means walking through a location and confirming that the assets recorded in your register are actually there, in the condition described. Run audits at least annually, more often for high-value or high-risk categories. The biggest time saver is scanning tags during the audit instead of manually cross-referencing a printed list — it turns an audit from a day-long project into an afternoon.',
  },
  {
    id: 'software',
    title: '6. What to look for in asset tracking software',
    body: 'Prioritize search performance at scale, a mobile experience that works without a dedicated app, an audit trail that logs changes automatically, and pricing that doesn\'t penalize you for adding more users. Many tools look similar with 50 test assets loaded — the differences show up at 5,000 assets and three years of history.',
  },
]

export default function AssetManagementGuidePage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Resources · Guide"
        title="The complete guide to asset management"
        subtitle="A practical walkthrough of building an asset register, choosing a tracking method, and setting up maintenance and audits that actually hold up."
      />

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <nav aria-label="Table of contents" className="mb-12 rounded-2xl border border-border bg-card p-6">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">On this page</p>
            <ul className="mt-3 flex flex-col gap-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-sm text-primary hover:underline">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-12">
            {sections.map((section) => (
              <div key={section.id} id={section.id}>
                <h2 className="text-xl tracking-tight text-foreground md:text-2xl">{section.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        headline="Ready to put this into practice?"
        subcopy="AssetGriffin covers every step in this guide — register, mobile scanning, maintenance, and audits — in one place."
      />
      <MarketingFooter />
    </main>
  )
}
