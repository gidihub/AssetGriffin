import { Sparkles } from 'lucide-react'

export function BetaInvite() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground">
        <Sparkles size={18} />
      </span>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-primary">Now accepting beta teams</p>
      <p className="text-sm text-foreground">Be part of the journey</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
        AssetGriffin is early. Join free, tell us what you need, and influence the roadmap as we grow.
      </p>
    </div>
  )
}
