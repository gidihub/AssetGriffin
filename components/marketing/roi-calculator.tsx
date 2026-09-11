'use client'

import { useMemo, useState } from 'react'

const TIME_REDUCTION_RATE = 0.7
const LOSS_PREVENTION_RATE = 0.5

export function RoiCalculator() {
  const [assetCount, setAssetCount] = useState('250')
  const [hoursPerWeek, setHoursPerWeek] = useState('5')
  const [hourlyRate, setHourlyRate] = useState('35')
  const [lossRate, setLossRate] = useState('4')
  const [assetValue, setAssetValue] = useState('500')

  const result = useMemo(() => {
    const assets = Number.parseFloat(assetCount)
    const hours = Number.parseFloat(hoursPerWeek)
    const rate = Number.parseFloat(hourlyRate)
    const loss = Number.parseFloat(lossRate)
    const value = Number.parseFloat(assetValue)

    if (
      [assets, hours, rate, loss, value].some((n) => !Number.isFinite(n) || n < 0)
    ) {
      return null
    }

    const annualHours = hours * 52
    const hoursSaved = annualHours * TIME_REDUCTION_RATE
    const timeSavings = hoursSaved * rate

    const annualLossExposure = assets * (loss / 100) * value
    const lossSavings = annualLossExposure * LOSS_PREVENTION_RATE

    return {
      hoursSaved,
      timeSavings,
      annualLossExposure,
      lossSavings,
      total: timeSavings + lossSavings,
    }
  }, [assetCount, hoursPerWeek, hourlyRate, lossRate, assetValue])

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">Tell us about your operation</h2>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Number of assets tracked</span>
            <input
              type="number"
              value={assetCount}
              onChange={(e) => setAssetCount(e.target.value)}
              min={0}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Hours per week spent on manual tracking today
            </span>
            <input
              type="number"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(e.target.value)}
              min={0}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Average fully-loaded hourly rate ($)</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              min={0}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Estimated annual loss rate for untracked assets (%)
            </span>
            <input
              type="number"
              value={lossRate}
              onChange={(e) => setLossRate(e.target.value)}
              min={0}
              max={100}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Average asset value ($)</span>
            <input
              type="number"
              value={assetValue}
              onChange={(e) => setAssetValue(e.target.value)}
              min={0}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold text-foreground">Estimated annual savings</h2>
        {result ? (
          <>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
              {fmtMoney(result.total)}
              <span className="text-sm font-medium text-muted-foreground"> / year</span>
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Time saved</p>
                <p className="mt-1.5 text-sm text-foreground">
                  ~{fmt(result.hoursSaved)} hours/year, worth{' '}
                  <span className="font-semibold">{fmtMoney(result.timeSavings)}</span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Assumes automated scanning and check-in/out cuts manual tracking time by {TIME_REDUCTION_RATE * 100}%
                  {' '}&mdash; a conservative estimate based on removing manual lookups and re-entry.
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Loss avoided</p>
                <p className="mt-1.5 text-sm text-foreground">
                  Estimated exposure of <span className="font-semibold">{fmtMoney(result.annualLossExposure)}</span>/year,
                  with <span className="font-semibold">{fmtMoney(result.lossSavings)}</span> avoidable
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Assumes accountability from check-out records prevents {LOSS_PREVENTION_RATE * 100}% of untracked loss
                  {' '}&mdash; a conservative estimate, not a guarantee.
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              These figures are directional estimates based on the inputs above and the stated assumptions, not a
              guaranteed outcome. Actual results depend on your current processes and how quickly your team adopts
              mobile scanning.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Enter non-negative values in every field to see an estimate.</p>
        )}
      </div>
    </div>
  )
}
