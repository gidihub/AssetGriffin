import { Search, Smartphone, Plug } from 'lucide-react'

const columns = [
  {
    icon: Search,
    title: 'Search that actually works.',
    body: 'Find any asset instantly, even at 10,000+ items.',
  },
  {
    icon: Smartphone,
    title: "A mobile experience that doesn't lag.",
    body: 'Scan, check out, and update from any phone — no dedicated app required.',
  },
  {
    icon: Plug,
    title: 'Real integrations.',
    body: 'Connect to the tools your team already runs on, not a closed system.',
  },
]

export function ProblemSection() {
  return (
    <section className="border-b border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl tracking-tight text-foreground md:text-4xl">
            Most asset tracking tools break the moment you actually need them
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">
            Free asset trackers are great — until your list hits a few hundred items and search stops working, the
            mobile app starts lagging, and you realize there&apos;s no way to connect it to the accounting or IT
            tools you already use. AssetGriffin is built to be the tool you don&apos;t have to replace in year two.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {columns.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon size={22} />
              </span>
              <div>
                <h3 className="text-base text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
