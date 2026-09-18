import type { SupabaseClient } from '@supabase/supabase-js'
import {
  GRIFFIN_SCAN_OVERAGE_RATE_USD,
  getScanAbuseCeilingForTier,
  getScanAllowanceForTier,
  tierAllowsOverage,
} from '@/lib/griffin-scan-allowances'
import { queueOverageScanInvoiceItem } from '@/lib/stripe-overage'

export type SubscriptionTier = 'free' | 'growth' | 'scale' | 'enterprise'

export const GRIFFIN_VISION_USAGE_TYPE = 'griffin_vision_photo' as const

export const GRIFFINEYE_USAGE_TYPES = [
  'griffin_vision_photo',
  'griffineye_query',
  'griffineye_text_extract',
] as const

export type GriffinEyeUsageType = (typeof GRIFFINEYE_USAGE_TYPES)[number]

export type VisionBillingSource = 'tier_allowance' | 'purchased_credit' | 'overage'

/** @deprecated Use getScanAllowanceForTier from griffin-scan-allowances. */
export const GRIFFIN_VISION_MONTHLY_CAPS: Record<SubscriptionTier, number> = {
  free: 50,
  growth: 500,
  scale: 2_500,
  enterprise: 10_000,
}

export type GriffinVisionUsageSnapshot = {
  tier: SubscriptionTier
  /** Included allowance consumed this calendar month. */
  used: number
  cap: number
  remaining: number
  monthKey: string
  /** Included allowance exhausted (may still scan on paid tiers via overage). */
  atCap: boolean
  /** Overage scans consumed this month (paid tiers only). */
  overageUsed: number
  overageChargeUsd: number
  /** Total scans this month (allowance + overage + legacy credits). */
  totalUsed: number
  abuseCeiling: number
  atAbuseCeiling: boolean
  allowsOverage: boolean
  /** Next scan will bill as overage. */
  willUseOverage: boolean
  /** @deprecated Legacy purchased scan balance — pack sales removed. */
  creditBalance: number
  canScan: boolean
  /** @deprecated Legacy — use willUseOverage. */
  willUseCredit: boolean
}

export type VisionUsageAccess = {
  snapshot: GriffinVisionUsageSnapshot
  billingSource: VisionBillingSource
}

function monthStartUtc(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function normalizeTier(value: string | null | undefined): SubscriptionTier {
  if (value === 'growth' || value === 'scale' || value === 'enterprise') return value
  return 'free'
}

export function getVisionCapForTier(tier: SubscriptionTier): number {
  return getScanAllowanceForTier(tier)
}

export function isGenuineAbuseCapViolation(snapshot: GriffinVisionUsageSnapshot): boolean {
  return snapshot.atAbuseCeiling && snapshot.abuseCeiling > snapshot.cap
}

export function buildVisionCapMessage(
  snapshot: GriffinVisionUsageSnapshot,
  actionLabel = 'scans',
): string {
  if (isGenuineAbuseCapViolation(snapshot)) {
    return `Your organization reached the monthly GriffinEye safety limit (${snapshot.abuseCeiling.toLocaleString()} ${actionLabel}). Contact support to review usage before scanning again.`
  }

  if (snapshot.tier === 'free') {
    return `You've used all ${snapshot.cap} included GriffinEye ${actionLabel} this month. Upgrade to Growth or higher to keep scanning, or use spreadsheet import to add assets without AI.`
  }

  if (snapshot.allowsOverage) {
    return `You've used all ${snapshot.cap} included GriffinEye ${actionLabel} this month. Additional scans on your plan are $${GRIFFIN_SCAN_OVERAGE_RATE_USD.toFixed(2)} each and are added to your next invoice.`
  }

  return `You've used all ${snapshot.cap} included GriffinEye ${actionLabel} this month.`
}

export async function getOrganizationTier(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<SubscriptionTier> {
  const { data, error } = await supabase
    .from('organizations')
    .select('subscription_tier')
    .eq('id', organizationId)
    .single()

  if (error) throw new Error(error.message)
  return normalizeTier(data?.subscription_tier)
}

export async function getCreditBalance(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('organizations')
    .select('griffin_vision_credits_balance')
    .eq('id', organizationId)
    .single()

  if (error) throw new Error(error.message)
  return data?.griffin_vision_credits_balance ?? 0
}

export async function getMonthlyTierVisionUsage(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const since = monthStartUtc()
  const { count, error } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('billing_source', 'tier_allowance')
    .gte('created_at', since)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getMonthlyOverageUsage(
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

export async function getMonthlyTotalVisionUsage(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const since = monthStartUtc()
  const { count, error } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', since)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getVisionUsageSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
  tier?: SubscriptionTier,
): Promise<GriffinVisionUsageSnapshot> {
  const resolvedTier = tier ?? (await getOrganizationTier(supabase, organizationId))
  const cap = getScanAllowanceForTier(resolvedTier)
  const abuseCeiling = getScanAbuseCeilingForTier(resolvedTier)
  const used = await getMonthlyTierVisionUsage(supabase, organizationId)
  const overageUsed = await getMonthlyOverageUsage(supabase, organizationId)
  const totalUsed = await getMonthlyTotalVisionUsage(supabase, organizationId)
  const creditBalance = await getCreditBalance(supabase, organizationId)
  const remaining = Math.max(0, cap - used)
  const atCap = used >= cap
  const allowsOverage = tierAllowsOverage(resolvedTier)
  const atAbuseCeiling = totalUsed >= abuseCeiling && abuseCeiling > cap
  const willUseOverage = allowsOverage && atCap && !atAbuseCeiling

  return {
    tier: resolvedTier,
    used,
    cap,
    remaining,
    monthKey: monthStartUtc().slice(0, 7),
    atCap,
    overageUsed,
    overageChargeUsd: overageUsed * GRIFFIN_SCAN_OVERAGE_RATE_USD,
    totalUsed,
    abuseCeiling,
    atAbuseCeiling,
    allowsOverage,
    willUseOverage,
    creditBalance,
    canScan: !atAbuseCeiling && (remaining > 0 || allowsOverage),
    willUseCredit: false,
  }
}

export async function getVisionUsageAccess(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<VisionUsageAccess> {
  const snapshot = await getVisionUsageSnapshot(supabase, organizationId)

  if (!snapshot.canScan) {
    if (isGenuineAbuseCapViolation(snapshot)) {
      console.warn('[griffineye/abuse-cap]', {
        organizationId,
        tier: snapshot.tier,
        totalUsed: snapshot.totalUsed,
        abuseCeiling: snapshot.abuseCeiling,
      })
    }
    const error = new Error(buildVisionCapMessage(snapshot))
    const coded = error as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }
    coded.code = isGenuineAbuseCapViolation(snapshot) ? 'ABUSE_CAP_EXCEEDED' : 'VISION_CAP_EXCEEDED'
    coded.snapshot = snapshot
    throw error
  }

  const billingSource: VisionBillingSource = snapshot.remaining > 0 ? 'tier_allowance' : 'overage'

  return { snapshot, billingSource }
}

/** @deprecated Use getVisionUsageAccess — kept as alias for route handlers. */
export async function assertVisionUsageAllowed(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<GriffinVisionUsageSnapshot> {
  const { snapshot } = await getVisionUsageAccess(supabase, organizationId)
  return snapshot
}

export type VisionUsageReservation = {
  usageLogId: string
  billingSource: VisionBillingSource
}

function isBillingSourceAmbiguityError(message: string): boolean {
  return message.includes('billing_source') && message.includes('ambiguous')
}

async function queueOverageInvoiceOrThrow(
  supabase: SupabaseClient,
  organizationId: string,
  usageLogId: string,
): Promise<void> {
  try {
    const invoiceResult = await queueOverageScanInvoiceItem(supabase, organizationId)
    if (invoiceResult.status === 'queued') {
      console.error('[griffin-vision/overage-invoice]', invoiceResult.reason)
    }
  } catch (invoiceError) {
    console.error('[griffin-vision/overage-invoice]', invoiceError)
    try {
      await releaseVisionUsage(supabase, usageLogId)
    } catch (releaseError) {
      console.error('[griffin-vision/overage-invoice] failed to release usage after invoice error', releaseError)
    }
    throw invoiceError
  }
}

export async function reserveVisionUsage(
  supabase: SupabaseClient,
  organizationId: string,
  usageType: GriffinEyeUsageType = GRIFFIN_VISION_USAGE_TYPE,
): Promise<VisionUsageReservation> {
  const { data, error } = await supabase.rpc('reserve_griffineye_usage', {
    p_organization_id: organizationId,
    p_usage_type: usageType,
  })

  if (error) {
    if (error.message.includes('ABUSE_CAP_EXCEEDED')) {
      const snapshot = await getVisionUsageSnapshot(supabase, organizationId)
      const capError = new Error(buildVisionCapMessage(snapshot))
      ;(capError as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).code = 'ABUSE_CAP_EXCEEDED'
      ;(capError as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).snapshot = snapshot
      throw capError
    }
    if (error.message.includes('VISION_CAP_EXCEEDED')) {
      const snapshot = await getVisionUsageSnapshot(supabase, organizationId)
      const capError = new Error(buildVisionCapMessage(snapshot))
      ;(capError as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).code = 'VISION_CAP_EXCEEDED'
      ;(capError as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).snapshot = snapshot
      throw capError
    }
    if (isBillingSourceAmbiguityError(error.message)) {
      throw new Error('GriffinEye usage reservation is temporarily unavailable. Try again shortly.')
    }
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.usage_log_id || !row?.billing_source) {
    throw new Error('Could not reserve GriffinEye usage.')
  }

  const billingSource = row.billing_source as VisionBillingSource
  const usageLogId = row.usage_log_id as string

  if (billingSource === 'overage') {
    await queueOverageInvoiceOrThrow(supabase, organizationId, usageLogId)
  }

  return {
    usageLogId,
    billingSource,
  }
}

export async function releaseVisionUsage(
  supabase: SupabaseClient,
  usageLogId: string,
): Promise<void> {
  const { error } = await supabase.rpc('release_griffin_vision_usage', {
    p_usage_log_id: usageLogId,
  })

  if (error) throw new Error(error.message)
}

/** @deprecated Prefer reserveVisionUsage. */
export async function recordVisionUsage(
  supabase: SupabaseClient,
  organizationId: string,
  billingSource: VisionBillingSource,
): Promise<void> {
  const { error } = await supabase.rpc('record_griffin_vision_usage', {
    p_organization_id: organizationId,
    p_billing_source: billingSource,
  })

  if (error) throw new Error(error.message)
}

export function visionCapExceededPayload(
  snapshot: GriffinVisionUsageSnapshot,
  code: 'VISION_CAP_EXCEEDED' | 'ABUSE_CAP_EXCEEDED' = 'VISION_CAP_EXCEEDED',
) {
  return {
    error: buildVisionCapMessage(snapshot),
    code,
    tier: snapshot.tier,
    used: snapshot.used,
    cap: snapshot.cap,
    overageUsed: snapshot.overageUsed,
    overageChargeUsd: snapshot.overageChargeUsd,
    totalUsed: snapshot.totalUsed,
    abuseCeiling: snapshot.abuseCeiling,
  }
}

export async function getRecentVisionUsageCount(
  supabase: SupabaseClient,
  organizationId: string,
  windowMinutes = 10,
): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()
  const { count, error } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('usage_type', GRIFFIN_VISION_USAGE_TYPE)
    .gte('created_at', since)

  if (error) throw new Error(error.message)
  return count ?? 0
}
