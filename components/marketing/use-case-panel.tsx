import { Lightbulb } from 'lucide-react'

interface UseCasePanelProps {
  title: string
  body: string
}

export function UseCasePanel({ title, body }: UseCasePanelProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-accent p-7">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-accent-foreground">
        <Lightbulb size={14} /> Illustrative scenario — not a verified customer case study
      </p>
      <h3 className="mt-3 text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">{body}</p>
    </div>
  )
}
