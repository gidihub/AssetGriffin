'use client'

import { useMemo, useState } from 'react'

export function DepreciationCalculator() {
  const [cost, setCost] = useState('2500')
  const [salvage, setSalvage] = useState('250')
  const [life, setLife] = useState('5')

  const schedule = useMemo(() => {
    const c = Number.parseFloat(cost)
    const s = Number.parseFloat(salvage)
    const l = Math.round(Number.parseFloat(life))

    if (!Number.isFinite(c) || !Number.isFinite(s) || !Number.isFinite(l) || l <= 0 || c <= s) {
      return null
    }

    const annual = (c - s) / l
    const rows = []
    let bookValue = c
    for (let year = 1; year <= l; year++) {
      bookValue = Math.max(s, bookValue - annual)
      rows.push({ year, depreciation: annual, bookValue })
    }
    return { annual, rows }
  }, [cost, salvage, life])

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">Enter asset details</h2>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Purchase cost ($)</span>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              min={0}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Estimated salvage value ($)</span>
            <input
              type="number"
              value={salvage}
              onChange={(e) => setSalvage(e.target.value)}
              min={0}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Useful life (years)</span>
            <input
              type="number"
              value={life}
              onChange={(e) => setLife(e.target.value)}
              min={1}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Uses the straight-line method: (cost − salvage value) ÷ useful life = annual depreciation.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">Depreciation schedule</h2>
        {schedule ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Annual depreciation:{' '}
              <span className="font-bold text-foreground">
                ${schedule.annual.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </p>
            <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-secondary">
                  <tr>
                    <th className="p-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Year</th>
                    <th className="p-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Depreciation</th>
                    <th className="p-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Book value</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.rows.map((row) => (
                    <tr key={row.year}>
                      <td className="border-t border-border p-2.5 text-foreground">{row.year}</td>
                      <td className="border-t border-border p-2.5 text-foreground">
                        ${row.depreciation.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="border-t border-border p-2.5 font-semibold text-foreground">
                        ${row.bookValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Enter a purchase cost greater than the salvage value and a useful life of at least one year to see the schedule.
          </p>
        )}
      </div>
    </div>
  )
}
