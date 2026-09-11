import { BarChart3, Boxes, ClipboardCheck, Wrench } from 'lucide-react'

const features = [
  {
    icon: Boxes,
    title: 'Asset Tracking',
    body: 'See every asset, where it is, who has it, and its full history — one searchable directory, not a spreadsheet.',
  },
  {
    icon: Wrench,
    title: 'Maintenance & Inspections',
    body: 'Schedule preventive maintenance, run inspection checklists, and catch problems before they become downtime.',
  },
  {
    icon: ClipboardCheck,
    title: 'Audit Trail',
    body: 'Every action, logged automatically — who checked out what, when, and why. Built for teams that get audited.',
  },
  {
    icon: BarChart3,
    title: 'Reporting',
    body: 'Generate the reports your finance and ops teams actually need, on a schedule, without manual exports.',
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Everything in one place</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Built for the full lifecycle of your assets
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
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
  )
}
