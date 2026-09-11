import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const competitors = [
  { name: 'AssetTiger', href: '/compare/assettiger' },
  { name: 'Asset Panda', href: '/compare/asset-panda' },
  { name: 'EZOfficeInventory', href: '/compare/ezofficeinventory' },
  { name: 'Reftab', href: '/compare/reftab' },
]

export function ComparisonTeaser() {
  return (
    <section id="compare" className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Switching made simple</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Thinking about switching?
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            See exactly how AssetGriffin compares on search, mobile experience, integrations, and pricing.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {competitors.map(({ name, href }) => (
            <Link
              key={name}
              href={href}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary"
            >
              <span className="text-sm font-semibold text-foreground">AssetGriffin vs {name}</span>
              <ArrowUpRight
                size={16}
                className="flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
