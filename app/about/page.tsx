import type { Metadata } from 'next'
import { Target, Users, Scale } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { CtaBand } from '@/components/marketing/cta-band'

export const metadata: Metadata = {
  title: 'About AssetGriffin',
  description: 'AssetGriffin builds asset tracking software that scales with your inventory, not your headcount.',
}

const values = [
  {
    icon: Scale,
    title: 'Pricing that scales fairly',
    body: 'We charge based on how many assets you track, not how many people need access. Adding a teammate should never cost you more.',
  },
  {
    icon: Target,
    title: 'Built to not be outgrown',
    body: 'We designed AssetGriffin around the moment most free tools break — a few hundred assets in — so it stays fast and useful for years, not months.',
  },
  {
    icon: Users,
    title: 'For the team that actually uses it',
    body: 'Every feature is judged by whether the person scanning a tag in a warehouse or job site would actually use it, not just whether it looks good in a demo.',
  },
]

export default function AboutPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Company · About"
        title="We built AssetGriffin because asset tracking shouldn't get harder as you grow"
        subtitle="Most free asset trackers work great for a few hundred items, then quietly break. We built AssetGriffin to be the tool teams don't have to replace in year two."
      />

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Asset-based pricing, from day one
          </h2>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            We started AssetGriffin after watching teams get quoted per-seat pricing for software that every employee
            needed access to, just to check something out. It didn&apos;t make sense to us, so we built pricing around
            the thing that actually determines cost to serve: how many assets you&apos;re tracking.
          </p>
        </div>
      </section>

      <CtaBand headline="See it for yourself" />
      <MarketingFooter />
    </main>
  )
}
