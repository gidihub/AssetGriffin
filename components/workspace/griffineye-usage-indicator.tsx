'use client'

import { useEffect, useState } from 'react'
import type { GriffinVisionUsageSnapshot } from '@/lib/griffin-vision-usage'
import { GRIFFIN_SCAN_OVERAGE_RATE_USD, formatOverageCharge } from '@/lib/griffin-scan-allowances'

export function GriffinEyeUsageIndicator({
  compact = false,
  className,
  refreshKey = 0,
  showOverage = false,
}: {
  compact?: boolean
  className?: string
  refreshKey?: number
  showOverage?: boolean
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

  const capLabel =
    usage.tier === 'enterprise' ? 'unlimited' : usage.cap.toLocaleString()
  const usedLabel = `${usage.used} of ${capLabel} scans used this month`
  const percent =
    usage.tier === 'enterprise' || usage.cap <= 0
      ? Math.min(100, Math.round((usage.used / Math.max(usage.cap, 1)) * 100))
      : Math.min(100, Math.round((usage.used / usage.cap) * 100))

  const overageLine =
    usage.allowsOverage && usage.overageUsed > 0
      ? `${usage.overageUsed} extra scan${usage.overageUsed === 1 ? '' : 's'} this month · ${formatOverageCharge(usage.overageUsed)}, added to your next invoice`
      : null

  if (compact) {
    return (
      <p className={`table-muted griffineye-usage-compact ${className ?? ''}`.trim()} aria-live="polite">
        {usedLabel}
        {overageLine ? ` · ${overageLine}` : ''}
      </p>
    )
  }

  return (
    <div className={`plan-usage griffineye-usage-card ${className ?? ''}`.trim()}>
      <div className="plan-usage-top">
        <span>GriffinEye scans this month</span>
        <strong>
          {usage.tier === 'enterprise'
            ? `${usage.used.toLocaleString()} used · unlimited plan`
            : `${usage.used.toLocaleString()} / ${usage.cap.toLocaleString()}`}
        </strong>
      </div>
      {usage.tier !== 'enterprise' ? (
        <div className="progress">
          <i style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      <span className="table-muted">
        {usage.tier === 'enterprise'
          ? usage.remaining > 0
            ? `${usage.remaining.toLocaleString()} included scan${usage.remaining === 1 ? '' : 's'} remaining · unlimited plan · resets monthly`
            : usage.allowsOverage
              ? `Included allowance used · additional scans are $${GRIFFIN_SCAN_OVERAGE_RATE_USD.toFixed(2)} each · unlimited plan`
              : 'Included allowance used · unlimited plan'
          : usage.remaining > 0
            ? `${usage.remaining.toLocaleString()} included scan${usage.remaining === 1 ? '' : 's'} remaining · resets monthly`
            : usage.allowsOverage
              ? `Included allowance used · additional scans are $${GRIFFIN_SCAN_OVERAGE_RATE_USD.toFixed(2)} each`
              : 'Included allowance used · upgrade to Growth for more scans or use spreadsheet import'}
      </span>
      {showOverage && overageLine ? (
        <span className="table-muted">{overageLine}</span>
      ) : null}
      {usage.willUseOverage ? (
        <span className="table-muted">Your next scan will count as overage billing.</span>
      ) : null}
      {usage.atAbuseCeiling ? (
        <span className="table-muted" style={{ color: '#B23B3B' }}>
          Monthly safety limit reached ({usage.abuseCeiling.toLocaleString()} scans). Contact support to review usage.
        </span>
      ) : null}
    </div>
  )
}
