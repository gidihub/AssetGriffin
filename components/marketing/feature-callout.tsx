import type { LucideIcon } from 'lucide-react'

interface FeatureCalloutProps {
  icon: LucideIcon
  title: string
  body: string
}

export function FeatureCallout({ icon: Icon, title, body }: FeatureCalloutProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-7">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon size={22} />
      </span>
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}
