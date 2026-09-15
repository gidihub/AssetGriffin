import type { SupabaseClient } from '@supabase/supabase-js'
import { recordAuditEvent } from '@/lib/griffineye-audit'
import { checkGriffinEyeRateLimit } from '@/lib/griffineye-security/rate-limit'
import { checkGriffinEyeSpendBreaker } from '@/lib/griffineye-security/spend-breaker'

export type GriffinEyeAccessProfile = {
  id: string
  organization_id: string
  email: string
  full_name: string | null
}

export type GriffinEyeAccessCheck =
  | { ok: true; rateRemaining: number; spendActionsToday: number }
  | { ok: false; status: number; error: string; code?: string }

type AccessGuardOptions = {
  endpoint: string
}

async function logQuotaCheck(
  supabase: SupabaseClient,
  profile: GriffinEyeAccessProfile,
  outcome: Record<string, unknown>,
) {
  try {
    await recordAuditEvent(supabase, profile.organization_id, {
      category: 'ai',
      action: 'GriffinEye quota check',
      source: 'system',
      actorId: profile.id,
      actorLabel: profile.full_name || profile.email,
      entityType: 'Quota',
      entityLabel: String(outcome.endpoint ?? 'griffineye'),
      summary: String(outcome.result ?? 'checked'),
      metadata: outcome,
    })
  } catch (error) {
    console.error('[griffineye-security/quota-audit]', error)
  }
}

/** Rate limit + spend breaker before reserving monthly credits. */
export async function assertGriffinEyeAccess(
  supabase: SupabaseClient,
  profile: GriffinEyeAccessProfile,
  options: AccessGuardOptions,
): Promise<GriffinEyeAccessCheck> {
  const rate = checkGriffinEyeRateLimit(profile.id)
  if (!rate.allowed) {
    await logQuotaCheck(supabase, profile, {
      endpoint: options.endpoint,
      result: 'rate_limited',
      retry_after_ms: rate.retryAfterMs,
    })
    return {
      ok: false,
      status: 429,
      error: 'Too many GriffinEye requests — wait a moment and try again.',
      code: 'RATE_LIMITED',
    }
  }

  const spend = await checkGriffinEyeSpendBreaker(supabase, profile.organization_id)
  if (!spend.allowed) {
    await logQuotaCheck(supabase, profile, {
      endpoint: options.endpoint,
      result: 'spend_breaker_blocked',
      actions_today: spend.actionsToday,
      estimated_spend_usd: spend.estimatedSpendUsd,
    })
    return { ok: false, status: 429, error: spend.reason, code: 'SPEND_BREAKER' }
  }

  await logQuotaCheck(supabase, profile, {
    endpoint: options.endpoint,
    result: 'allowed',
    rate_remaining: rate.remaining,
    actions_today: spend.actionsToday,
    estimated_spend_usd: spend.estimatedSpendUsd,
  })

  return { ok: true, rateRemaining: rate.remaining, spendActionsToday: spend.actionsToday }
}
