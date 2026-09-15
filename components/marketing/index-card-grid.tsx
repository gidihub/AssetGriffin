import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'

export interface IndexCard {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

export interface IndexCardGroup {
  title?: string
  cards: IndexCard[]
}

function IndexCardLink({ card }: { card: IndexCard }) {
  const Icon = card.icon
  return (
    <Link
      href={card.href}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon size={22} />
      </span>
      <div>
        <h3 className="text-base text-foreground">{card.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm text-primary">
        Learn more
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

export function IndexCardGrid({ groups }: { groups: IndexCardGroup[] }) {
  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <div key={group.title ?? 'ungrouped'}>
          {group.title && (
            <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{group.title}</h2>
          )}
          <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${group.title ? 'mt-5' : ''}`}>
            {group.cards.map((card) => (
              <IndexCardLink key={card.href} card={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
