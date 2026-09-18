import type { SubscriptionTier } from '@/lib/supabase/database.types'

/** Per-scan overage rate for paid tiers (USD). */
export const GRIFFIN_SCAN_OVERAGE_RATE_USD = 0.02

/** Included GriffinEye scans per organization per calendar month. */
export const GRIFFIN_SCAN_MONTHLY_ALLOWANCE: Record<SubscriptionTier, number> = {
  free: 50,
  growth: 500,
  scale: 2_500,
  enterprise: 10_000,
}

/**
 * Abuse backstop — hard block for the month (must exceed included allowance to apply).
 * Growth/Scale use 5× stated allowance. Enterprise backstop is not marketed.
 */
export const GRIFFIN_SCAN_ABUSE_CEILING: Record<SubscriptionTier, number> = {
  free: 50,
  growth: 2_500,
  scale: 12_500,
  enterprise: 50_000,
}

export function getScanAllowanceForTier(tier: SubscriptionTier): number {
  return GRIFFIN_SCAN_MONTHLY_ALLOWANCE[tier]
}

export function getScanAbuseCeilingForTier(tier: SubscriptionTier): number {
  return GRIFFIN_SCAN_ABUSE_CEILING[tier]
}

export function tierAllowsOverage(tier: SubscriptionTier): boolean {
  return tier !== 'free'
}

export function formatScanAllowanceLabel(tier: SubscriptionTier): string {
  if (tier === 'enterprise') return 'Unlimited'
  return `${GRIFFIN_SCAN_MONTHLY_ALLOWANCE[tier].toLocaleString()}/month`
}

export function formatOverageCharge(scanCount: number): string {
  const usd = scanCount * GRIFFIN_SCAN_OVERAGE_RATE_USD
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd)
}
