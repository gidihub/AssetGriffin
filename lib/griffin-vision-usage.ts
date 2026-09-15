import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export type SubscriptionTier = 'free' | 'growth' | 'scale' | 'enterprise'

export const GRIFFIN_VISION_USAGE_TYPE = 'griffin_vision_photo' as const

/**
 * Every GriffinEye action that calls OpenAI bills against the same monthly
 * allowance, since they all carry the same underlying cost.
 */
export const GRIFFINEYE_USAGE_TYPES = [
  'griffin_vision_photo',
  'griffineye_query',
  'griffineye_text_extract',
] as const

export type GriffinEyeUsageType = (typeof GRIFFINEYE_USAGE_TYPES)[number]

export type VisionBillingSource = 'tier_allowance' | 'purchased_credit'

/** Monthly caps per tier. Enterprise uses a high soft cap until confirmed. */
export const GRIFFIN_VISION_MONTHLY_CAPS: Record<SubscriptionTier, number> = {
  free: 10,
  growth: 100,
  scale: 1000,
  enterprise: 10_000,
}

export type GriffinVisionUsageSnapshot = {
  tier: SubscriptionTier
  /** Tier allowance used this calendar month (excludes credit-backed scans). */
  used: number
  cap: number
  remaining: number
  monthKey: string
  /** Tier monthly allowance exhausted. */
  atCap: boolean
  creditBalance: number
  /** Whether another photo scan can proceed (tier remaining or credits available). */
  canScan: boolean
  /** Next scan will consume a purchased credit instead of tier allowance. */
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
  return GRIFFIN_VISION_MONTHLY_CAPS[tier]
}

export function buildVisionCapMessage(
  snapshot: GriffinVisionUsageSnapshot,
  actionLabel = 'photo scans',
  fallbackHint = 'Buy more scans, upgrade your plan, or use spreadsheet import to continue.',
): string {
  if (snapshot.creditBalance > 0) {
    return `You've used all ${snapshot.cap} included GriffinEye ${actionLabel} this month. Purchased credits will be used automatically.`
  }
  return `You've used all ${snapshot.cap} of your GriffinEye ${actionLabel} this month. ${fallbackHint}`
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

/**
 * Tier allowance consumed this calendar month across every GriffinEye action —
 * photo scans, natural-language queries, and text extraction share one pool.
 */
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

export async function getVisionUsageSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
  tier?: SubscriptionTier,
): Promise<GriffinVisionUsageSnapshot> {
  const resolvedTier = tier ?? (await getOrganizationTier(supabase, organizationId))
  const cap = getVisionCapForTier(resolvedTier)
  const used = await getMonthlyTierVisionUsage(supabase, organizationId)
  const creditBalance = await getCreditBalance(supabase, organizationId)
  const remaining = Math.max(0, cap - used)
  const atCap = used >= cap
  const willUseCredit = atCap && creditBalance > 0
  const canScan = remaining > 0 || creditBalance > 0

  return {
    tier: resolvedTier,
    used,
    cap,
    remaining,
    monthKey: monthStartUtc().slice(0, 7),
    atCap,
    creditBalance,
    canScan,
    willUseCredit,
  }
}

export async function getVisionUsageAccess(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<VisionUsageAccess> {
  const snapshot = await getVisionUsageSnapshot(supabase, organizationId)

  if (!snapshot.canScan) {
    const error = new Error(buildVisionCapMessage(snapshot))
    ;(error as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).code = 'VISION_CAP_EXCEEDED'
    ;(error as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).snapshot = snapshot
    throw error
  }

  const billingSource: VisionBillingSource = snapshot.remaining > 0 ? 'tier_allowance' : 'purchased_credit'

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

async function applyCreditDelta(
  admin: SupabaseClient,
  organizationId: string,
  delta: number,
): Promise<number> {
  const { data, error } = await admin.rpc('apply_griffin_vision_credit_delta', {
    p_organization_id: organizationId,
    p_delta: delta,
  })

  if (error) {
    if (error.message.includes('Insufficient credits')) {
      throw new Error('Insufficient credits')
    }
    throw new Error(error.message)
  }

  if (typeof data !== 'number') {
    throw new Error('Could not adjust credit balance.')
  }

  return data
}

/**
 * Fallback when reserve_griffineye_usage in Postgres still shadows billing_source
 * via RETURNS TABLE. Mirrors the RPC logic without a single DB transaction.
 */
async function reserveVisionUsageFallback(
  supabase: SupabaseClient,
  organizationId: string,
  usageType: GriffinEyeUsageType,
): Promise<VisionUsageReservation> {
  const tier = await getOrganizationTier(supabase, organizationId)
  const cap = getVisionCapForTier(tier)
  const tierUsed = await getMonthlyTierVisionUsage(supabase, organizationId)
  const creditBalance = await getCreditBalance(supabase, organizationId)

  let billingSource: VisionBillingSource
  if (tierUsed < cap) {
    billingSource = 'tier_allowance'
  } else if (creditBalance > 0) {
    billingSource = 'purchased_credit'
  } else {
    const snapshot = await getVisionUsageSnapshot(supabase, organizationId, tier)
    const capError = new Error(buildVisionCapMessage(snapshot))
    ;(capError as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).code = 'VISION_CAP_EXCEEDED'
    ;(capError as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).snapshot = snapshot
    throw capError
  }

  // Service role bypasses RLS — same writes the broken RPC would have made.
  const admin = createAdminClient()
  let creditsBalanceAfter: number | null = null

  if (billingSource === 'purchased_credit') {
    creditsBalanceAfter = await applyCreditDelta(admin, organizationId, -1)
  }

  const { data: logRow, error: logError } = await admin
    .from('ai_usage_log')
    .insert({
      organization_id: organizationId,
      usage_type: usageType,
      billing_source: billingSource,
    })
    .select('id')
    .single()

  if (logError || !logRow?.id) {
    if (billingSource === 'purchased_credit') {
      await applyCreditDelta(admin, organizationId, 1).catch(() => undefined)
    }
    throw new Error(logError?.message ?? 'Could not reserve GriffinEye usage.')
  }

  if (billingSource === 'purchased_credit' && creditsBalanceAfter !== null) {
    const { error: txError } = await admin.from('ai_credit_transactions').insert({
      organization_id: organizationId,
      transaction_type: 'consumption',
      credits_delta: -1,
      credits_balance_after: creditsBalanceAfter,
      ai_usage_log_id: logRow.id,
    })

    if (txError) {
      await admin.from('ai_usage_log').delete().eq('id', logRow.id)
      await applyCreditDelta(admin, organizationId, 1).catch(() => undefined)
      throw new Error(txError.message)
    }
  }

  return { usageLogId: logRow.id, billingSource }
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
    if (error.message.includes('VISION_CAP_EXCEEDED')) {
      const snapshot = await getVisionUsageSnapshot(supabase, organizationId)
      const capError = new Error(buildVisionCapMessage(snapshot))
      ;(capError as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).code = 'VISION_CAP_EXCEEDED'
      ;(capError as Error & { code: string; snapshot: GriffinVisionUsageSnapshot }).snapshot = snapshot
      throw capError
    }
    if (isBillingSourceAmbiguityError(error.message)) {
      return reserveVisionUsageFallback(supabase, organizationId, usageType)
    }
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.usage_log_id || !row?.billing_source) {
    throw new Error('Could not reserve GriffinEye usage.')
  }

  return {
    usageLogId: row.usage_log_id as string,
    billingSource: row.billing_source as VisionBillingSource,
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

/** @deprecated Prefer reserveVisionUsage — kept for callers that pre-select billing source. */
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
