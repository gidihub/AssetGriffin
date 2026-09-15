'use client'

import { useEffect, useState } from 'react'
import type { GriffinVisionUsageSnapshot } from '@/lib/griffin-vision-usage'

export function GriffinEyeUsageIndicator({
  compact = false,
  className,
  refreshKey = 0,
}: {
  compact?: boolean
  className?: string
  refreshKey?: number
}) {
  const [usage, setUsage] = useState<GriffinVisionUsageSnapshot | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUsage() {
      try {
        const response = await fetch('/api/griffin-vision/usage')
        const data = (await response.json()) as GriffinVisionUsageSnapshot & { error?: string }
        if (!response.ok || cancelled) return
        setUsage(data)
      } catch {
        if (!cancelled) setUsage(null)
      }
    }

    void loadUsage()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (!usage) return null

  const percent = usage.cap > 0 ? Math.min(100, Math.round((usage.used / usage.cap) * 100)) : 0
  // Photo scans, assistant questions, and text extraction all draw on this one
  // allowance, so the wording stays action-neutral.
  const label = `${usage.used} of ${usage.cap} included AI actions used this month`

  if (compact) {
    return (
      <p className={`table-muted griffineye-usage-compact ${className ?? ''}`.trim()} aria-live="polite">
        {label}
        {usage.creditBalance > 0 ? ` · ${usage.creditBalance} purchased credits available` : ''}
      </p>
    )
  }

  return (
    <div className={`plan-usage griffineye-usage-card ${className ?? ''}`.trim()}>
      <div className="plan-usage-top">
        <span>Included monthly AI actions</span>
        <strong>
          {usage.used} / {usage.cap} this month
        </strong>
      </div>
      <div className="progress">
        <i style={{ width: `${percent}%` }} />
      </div>
      <span className="table-muted">
        {usage.remaining > 0
          ? `${usage.remaining} included AI actions remaining · resets monthly`
          : usage.creditBalance > 0
            ? `Monthly allowance used · ${usage.creditBalance} purchased credits available`
            : 'Monthly allowance used · buy more credits or use spreadsheet import'}
      </span>
      {usage.creditBalance > 0 ? (
        <span className="table-muted">Purchased credit balance: {usage.creditBalance} (rolls over)</span>
      ) : null}
    </div>
  )
}
