'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  formatUsdFromCents,
  GRIFFIN_CREDIT_PACKS,
  type GriffinCreditPackKey,
} from '@/lib/griffin-credit-packs'

export function GriffinCreditPurchase({
  compact = false,
  onCheckoutStarted,
}: {
  compact?: boolean
  onCheckoutStarted?: () => void
}) {
  const [loadingPack, setLoadingPack] = useState<GriffinCreditPackKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout(packKey: GriffinCreditPackKey) {
    setLoadingPack(packKey)
    setError(null)
    onCheckoutStarted?.()

    try {
      const response = await fetch('/api/billing/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packKey }),
      })
      const data = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'Could not start checkout.')
      }

      window.location.href = data.url
    } catch (err) {
      setLoadingPack(null)
      setError(err instanceof Error ? err.message : 'Could not start checkout.')
    }
  }

  return (
    <div className={compact ? 'credit-pack-grid credit-pack-grid-compact' : 'credit-pack-grid'}>
      {GRIFFIN_CREDIT_PACKS.map((pack) => {
        const isLoading = loadingPack === pack.key

        return (
          <button
            key={pack.key}
            type="button"
            className={`credit-pack-card${pack.highlighted ? ' credit-pack-card-highlighted' : ''}`}
            disabled={loadingPack != null}
            onClick={() => void startCheckout(pack.key)}
          >
            <span className="eyebrow">{pack.name.toUpperCase()}</span>
            <strong>{pack.credits} scans</strong>
            <span className="credit-pack-price">{formatUsdFromCents(pack.priceCents)}</span>
            {!compact ? (
              <span className="table-muted">
                {formatUsdFromCents(Math.round(pack.priceCents / pack.credits))} per scan · rolls over monthly
              </span>
            ) : null}
            {isLoading ? (
              <span className="credit-pack-loading">
                <Loader2 size={14} className="spin" /> Redirecting to checkout…
              </span>
            ) : null}
          </button>
        )
      })}
      {error ? (
        <p className="table-muted credit-pack-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
