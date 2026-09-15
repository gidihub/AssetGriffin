'use client'

import { useCallback, useEffect, useState } from 'react'
import { GriffinCreditPurchase } from '@/components/workspace/griffin-credit-purchase'
import { GriffinEyeUsageIndicator } from '@/components/workspace/griffineye-usage-indicator'
import { DataTable } from '@/components/workspace/primitives'
import { formatUsdFromCents } from '@/lib/griffin-credit-packs'
import type { CreditPurchaseRow } from '@/lib/griffin-credits'

function formatPurchaseDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

type CheckoutVerificationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'fulfilled'; credits?: number }
  | { status: 'pending' }
  | { status: 'invalid' }
  | { status: 'error'; message: string }

export function GriffinBillingCredits({
  purchaseNotice,
  checkoutSessionId,
}: {
  purchaseNotice?: 'cancelled' | null
  checkoutSessionId?: string | null
}) {
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [purchases, setPurchases] = useState<CreditPurchaseRow[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [checkoutVerification, setCheckoutVerification] = useState<CheckoutVerificationState>({ status: 'idle' })

  const loadBillingCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/credits/transactions')
      const data = (await response.json()) as {
        creditBalance?: number
        purchases?: CreditPurchaseRow[]
        error?: string
      }
      if (!response.ok) return
      setCreditBalance(data.creditBalance ?? 0)
      setPurchases(data.purchases ?? [])
    } catch {
      setCreditBalance(null)
    }
  }, [])

  useEffect(() => {
    void loadBillingCredits()
  }, [loadBillingCredits, refreshKey])

  useEffect(() => {
    if (!checkoutSessionId) return

    let cancelled = false
    setCheckoutVerification({ status: 'loading' })

    async function verifyCheckout() {
      try {
        const response = await fetch(
          `/api/billing/credits/verify?session_id=${encodeURIComponent(checkoutSessionId)}`,
        )
        const data = (await response.json()) as {
          status?: string
          credits?: number
          error?: string
        }

        if (!response.ok) {
          throw new Error(data.error ?? 'Could not verify checkout.')
        }

        if (cancelled) return

        if (data.status === 'fulfilled') {
          setCheckoutVerification({ status: 'fulfilled', credits: data.credits })
          setRefreshKey((key) => key + 1)
          return
        }

        if (data.status === 'paid_pending_fulfillment') {
          setCheckoutVerification({ status: 'pending' })
          setRefreshKey((key) => key + 1)
          return
        }

        setCheckoutVerification({ status: 'invalid' })
      } catch (error) {
        if (!cancelled) {
          setCheckoutVerification({
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not verify checkout.',
          })
        }
      }
    }

    void verifyCheckout()
    return () => {
      cancelled = true
    }
  }, [checkoutSessionId])

  return (
    <>
      <div className="settings-card" style={{ marginTop: 18 }}>
        <div className="settings-card-header">
          <div>
            <h2>GriffinEye photo scans</h2>
            <p>Your monthly tier allowance resets each month. Purchased scans roll over.</p>
          </div>
        </div>
        <div style={{ padding: '0 21px 18px' }}>
          <GriffinEyeUsageIndicator refreshKey={refreshKey} />
          <div className="credit-balance-row">
            <span>Purchased scan balance</span>
            <strong>{creditBalance == null ? '—' : `${creditBalance} credits`}</strong>
          </div>
          {checkoutVerification.status === 'loading' ? (
            <div className="workflow-note" style={{ marginTop: 12 }}>
              Verifying your checkout…
            </div>
          ) : null}
          {checkoutVerification.status === 'fulfilled' ? (
            <div className="workflow-note" style={{ marginTop: 12, background: '#E8F6EE', color: '#1E7B34' }}>
              Payment confirmed
              {checkoutVerification.credits ? ` — ${checkoutVerification.credits} scans added to your balance.` : ' — your purchased scans have been added to your balance.'}
            </div>
          ) : null}
          {checkoutVerification.status === 'pending' ? (
            <div className="workflow-note" style={{ marginTop: 12 }}>
              Payment received. Your scan balance will update shortly once processing completes.
            </div>
          ) : null}
          {checkoutVerification.status === 'invalid' ? (
            <div className="workflow-note" style={{ marginTop: 12, color: '#B23B3B', background: '#FBE7E7' }}>
              We could not verify that checkout session for this organization.
            </div>
          ) : null}
          {checkoutVerification.status === 'error' ? (
            <div className="workflow-note" style={{ marginTop: 12, color: '#B23B3B', background: '#FBE7E7' }}>
              {checkoutVerification.message}
            </div>
          ) : null}
          {purchaseNotice === 'cancelled' ? (
            <div className="workflow-note" style={{ marginTop: 12 }}>
              Checkout was cancelled. No credits were added.
            </div>
          ) : null}
        </div>
      </div>

      <div className="settings-card" style={{ marginTop: 18 }}>
        <div className="settings-card-header">
          <div>
            <h2>Buy more scans</h2>
            <p>Top up GriffinEye photo extraction when you need more than your monthly allowance.</p>
          </div>
        </div>
        <div style={{ padding: '0 21px 21px' }}>
          <GriffinCreditPurchase onCheckoutStarted={() => setRefreshKey((key) => key + 1)} />
        </div>
      </div>

      <div className="settings-card" style={{ marginTop: 18 }}>
        <div className="settings-card-header">
          <div>
            <h2>Credit purchase history</h2>
            <p>Successful scan pack purchases for your organization.</p>
          </div>
        </div>
        <DataTable
          rows={purchases}
          columns={[
            {
              key: 'date',
              header: 'Date',
              render: (row) => formatPurchaseDate(row.createdAt),
              sortValue: (row) => row.createdAt,
            },
            { key: 'pack', header: 'Pack', render: (row) => row.packName },
            { key: 'credits', header: 'Scans', render: (row) => String(row.credits) },
            {
              key: 'amount',
              header: 'Cost',
              render: (row) => formatUsdFromCents(row.amountCents),
            },
          ]}
          emptyState={<p className="table-muted" style={{ padding: '12px 21px 18px' }}>No credit purchases yet.</p>}
        />
      </div>
    </>
  )
}
