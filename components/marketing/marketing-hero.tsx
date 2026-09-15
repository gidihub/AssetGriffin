import Link from 'next/link'
import { ArrowUpRight, Boxes, ShieldCheck, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MarketingHero() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">Asset tracking, unlimited</p>
          <h1 className="mt-4 text-balance text-4xl font-medium leading-[1.08] tracking-tight text-foreground md:text-[3.1rem]">
            Asset tracking software that scales with you
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Track unlimited assets, unlimited users. No per-seat pricing, no surprise fees when you outgrow the free
            tier.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              render={<Link href="/app" />}
              nativeButton={false}
              size="lg"
              className="h-12 rounded-lg px-6 text-[15px] font-medium"
            >
              Start free — no credit card <ArrowUpRight size={18} />
            </Button>
            <Button
              render={<a href="#compare" />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="h-12 rounded-lg border-border px-6 text-[15px] font-medium"
            >
              See how we compare
            </Button>
          </div>

          <div className="mt-12 max-w-md rounded-xl border border-primary/20 bg-accent/40 px-4 py-3.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">Now in beta</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              We&apos;re just getting started — be part of the journey. Start free, share feedback, and help shape what
              we build next.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_20px_60px_-25px_rgba(31,35,40,0.35)]">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">Overview</p>
                <p className="mt-1 text-sm text-foreground">Asset portfolio</p>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] text-accent-foreground">Live</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Total assets</span>
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-accent-foreground">
                    <Boxes size={13} />
                  </span>
                </div>
                <p className="mt-2 text-2xl tracking-tight text-foreground">12,842</p>
                <p className="mt-1 text-[10px] text-primary">+18.6% this quarter</p>
              </div>
              <div className="rounded-xl border border-border p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Audit coverage</span>
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-accent-foreground">
                    <ShieldCheck size={13} />
                  </span>
                </div>
                <p className="mt-2 text-2xl tracking-tight text-foreground">96.2%</p>
                <div className="mt-2 h-1.5 rounded-full bg-muted">
                  <div className="h-full w-[96%] rounded-full bg-primary" />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground">Search results</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">0.04s · 10,482 records</span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { name: 'Dell Latitude 5440', tag: 'AGF-10482' },
                  { name: 'Sony FX3 Camera', tag: 'AGF-10471' },
                  { name: 'Herman Miller Aeron', tag: 'AGF-10465' },
                ].map((row) => (
                  <div key={row.tag} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-background text-muted-foreground">
                        <Wrench size={12} />
                      </span>
                      <span className="text-[11px] text-foreground">{row.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{row.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
