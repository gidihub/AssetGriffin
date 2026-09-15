import { Lightbulb } from 'lucide-react'

interface UseCasePanelProps {
  title: string
  body: string
}

export function UseCasePanel({ title, body }: UseCasePanelProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-accent p-7">
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-accent-foreground">
        <Lightbulb size={14} /> Illustrative scenario — not a verified customer case study
      </p>
      <h3 className="mt-3 text-base text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">{body}</p>
    </div>
  )
}
