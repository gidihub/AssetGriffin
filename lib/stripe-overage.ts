import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { GRIFFIN_SCAN_OVERAGE_RATE_USD } from '@/lib/griffin-scan-allowances'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe'

/**
 * Stripe metered billing assessment (2026-03):
 * - No subscription checkout or Billing Meters are wired in this repo yet.
 * - Overage is tracked in ai_usage_log (billing_source = overage) and aggregated
 *   into one pending invoice item per organization per calendar month.
 * - Invoice item IDs and synced scan counts persist in organizations.settings.
 */

export type OverageInvoiceResult =
  | { status: 'invoiced'; invoiceItemId: string }
  | { status: 'queued'; reason: 'missing_stripe_customer' | 'missing_stripe_key' }
  | { status: 'skipped'; reason: 'no_overage' | 'test_or_disabled' }

const OVERAGE_SETTINGS_KEY = 'griffineyeOverageInvoices'

type OverageInvoicePeriodState = {
  invoiceItemId: string
  syncedScanCount: number
}

type OverageSettingsRoot = {
  griffineyeOverageInvoices?: Record<string, OverageInvoicePeriodState>
}

function monthBillingPeriod(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthStartUtc(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

async function getMonthlyOverageScanCount(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const since = monthStartUtc()
  const { count, error } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('billing_source', 'overage')
    .gte('created_at', since)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function loadOverageInvoiceState(
  organizationId: string,
  billingPeriod: string,
): Promise<OverageInvoicePeriodState | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  if (error) throw new Error(error.message)

  const settings = (data?.settings ?? {}) as OverageSettingsRoot
  return settings.griffineyeOverageInvoices?.[billingPeriod] ?? null
}

async function saveOverageInvoiceState(
  organizationId: string,
  billingPeriod: string,
  state: OverageInvoicePeriodState,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc('merge_griffineye_overage_invoice_state', {
    p_org_id: organizationId,
    p_billing_period: billingPeriod,
    p_invoice_item_id: state.invoiceItemId,
    p_synced_scan_count: state.syncedScanCount,
  })

  if (error) throw new Error(error.message)
}

function overageInvoiceItemIdempotencyKey(
  organizationId: string,
  billingPeriod: string,
  previousSyncedScanCount: number,
  currentScanCount: number,
): string {
  return `griffineye-overage-${organizationId}-${billingPeriod}-${previousSyncedScanCount}-${currentScanCount}`
}

async function findPendingOverageItem(
  stripe: Stripe,
  customerId: string,
  organizationId: string,
  billingPeriod: string,
): Promise<Stripe.InvoiceItem | null> {
  let startingAfter: string | undefined

  while (true) {
    const page = await stripe.invoiceItems.list({
      customer: customerId,
      pending: true,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    const found = page.data.find(
      (item) =>
        item.metadata?.purchase_type === 'griffineye_overage' &&
        item.metadata?.billing_period === billingPeriod &&
        item.metadata?.organization_id === organizationId,
    )
    if (found) return found

    if (!page.has_more || page.data.length === 0) break
    startingAfter = page.data[page.data.length - 1]?.id
  }

  return null
}

async function resolveBillableOverageCount(
  stripe: Stripe,
  organizationId: string,
  billingPeriod: string,
  currentCount: number,
  state: OverageInvoicePeriodState | null,
): Promise<{ billableCount: number; state: OverageInvoicePeriodState | null }> {
  let syncedScanCount = state?.syncedScanCount ?? 0
  let nextState = state

  if (state?.invoiceItemId) {
    try {
      const item = await stripe.invoiceItems.retrieve(state.invoiceItemId)
      if (item.invoice) {
        const invoicedCount = Number(item.metadata?.scan_count ?? 0)
        syncedScanCount = Math.max(syncedScanCount, Number.isFinite(invoicedCount) ? invoicedCount : 0)
        nextState = { invoiceItemId: '', syncedScanCount }
        await saveOverageInvoiceState(organizationId, billingPeriod, nextState)
      }
    } catch {
      // Stale or deleted invoice item — fall back to pending lookup below.
    }
  }

  const billableCount = currentCount - syncedScanCount
  return { billableCount, state: nextState }
}

export async function queueOverageScanInvoiceItem(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OverageInvoiceResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { status: 'queued', reason: 'missing_stripe_key' }
  }

  const billingPeriod = monthBillingPeriod()
  const currentCount = await getMonthlyOverageScanCount(supabase, organizationId)
  if (currentCount <= 0) {
    return { status: 'skipped', reason: 'no_overage' }
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', organizationId)
    .single()

  if (error) throw new Error(error.message)

  const customerId = org?.stripe_customer_id
  if (!customerId) {
    return { status: 'queued', reason: 'missing_stripe_customer' }
  }

  const stripe = getStripeClient()
  let persistedState = await loadOverageInvoiceState(organizationId, billingPeriod)
  const { billableCount, state: resolvedState } = await resolveBillableOverageCount(
    stripe,
    organizationId,
    billingPeriod,
    currentCount,
    persistedState,
  )
  persistedState = resolvedState

  if (billableCount <= 0) {
    return { status: 'skipped', reason: 'no_overage' }
  }

  const amountCents = Math.round(GRIFFIN_SCAN_OVERAGE_RATE_USD * 100 * billableCount)
  const description = `GriffinEye overage · ${billableCount} scan${billableCount === 1 ? '' : 's'} @ $${GRIFFIN_SCAN_OVERAGE_RATE_USD.toFixed(2)}/scan (${billingPeriod})`
  const metadata = {
    organization_id: organizationId,
    purchase_type: 'griffineye_overage',
    billing_period: billingPeriod,
    scan_count: String(currentCount),
    billable_scan_count: String(billableCount),
  }

  let pendingItem: Stripe.InvoiceItem | null = null
  if (persistedState?.invoiceItemId) {
    try {
      const item = await stripe.invoiceItems.retrieve(persistedState.invoiceItemId)
      if (!item.invoice) pendingItem = item
    } catch {
      pendingItem = null
    }
  }

  if (!pendingItem) {
    pendingItem = await findPendingOverageItem(stripe, customerId, organizationId, billingPeriod)
  }

  if (pendingItem) {
    const item = await stripe.invoiceItems.update(pendingItem.id, {
      amount: amountCents,
      description,
      metadata,
    })

    await saveOverageInvoiceState(organizationId, billingPeriod, {
      invoiceItemId: item.id,
      syncedScanCount: persistedState?.syncedScanCount ?? 0,
    })

    return { status: 'invoiced', invoiceItemId: item.id }
  }

  const item = await stripe.invoiceItems.create(
    {
      customer: customerId,
      amount: amountCents,
      currency: 'usd',
      description,
      metadata,
    },
    {
      idempotencyKey: overageInvoiceItemIdempotencyKey(
        organizationId,
        billingPeriod,
        persistedState?.syncedScanCount ?? 0,
        currentCount,
      ),
    },
  )

  await saveOverageInvoiceState(organizationId, billingPeriod, {
    invoiceItemId: item.id,
    syncedScanCount: persistedState?.syncedScanCount ?? 0,
  })

  return { status: 'invoiced', invoiceItemId: item.id }
}
