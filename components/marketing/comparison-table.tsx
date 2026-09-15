import { Check, Minus } from 'lucide-react'

export interface ComparisonRow {
  label: string
  valueA: string
  valueB: string
  aWins?: boolean
}

interface ComparisonTableProps {
  competitorName: string
  rows: ComparisonRow[]
}

export function ComparisonTable({ competitorName, rows }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="bg-secondary">
            <th className="p-4 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">Category</th>
            <th className="p-4 font-mono text-xs uppercase tracking-[0.08em] text-primary">AssetGriffin</th>
            <th className="p-4 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">{competitorName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 1 ? 'bg-secondary/50' : undefined}>
              <td className="border-t border-border p-4 text-sm text-foreground">{row.label}</td>
              <td className="border-t border-border p-4 text-sm text-foreground">
                <span className="flex items-start gap-2">
                  {row.aWins !== false && <Check size={16} className="mt-0.5 flex-shrink-0 text-primary" />}
                  {row.valueA}
                </span>
              </td>
              <td className="border-t border-border p-4 text-sm text-muted-foreground">
                <span className="flex items-start gap-2">
                  <Minus size={16} className="mt-0.5 flex-shrink-0 text-muted-foreground/60" />
                  {row.valueB}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
