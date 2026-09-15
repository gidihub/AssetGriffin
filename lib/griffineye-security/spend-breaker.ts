import type { SupabaseClient } from '@supabase/supabase-js'

/** Estimated USD per GriffinEye action for daily spend ceiling (env-tunable). */
export const GRIFFINEYE_ESTIMATED_COST_USD = Number(process.env.GRIFFINEYE_ESTIMATED_COST_USD ?? 0.02)

/** Org-wide daily spend backstop across all GriffinEye endpoints. */
export const GRIFFINEYE_DAILY_SPEND_CAP_USD = Number(process.env.GRIFFINEYE_DAILY_SPEND_CAP_USD ?? 25)

export type SpendBreakerResult =
  | { allowed: true; actionsToday: number; estimatedSpendUsd: number }
  | { allowed: false; reason: string; actionsToday: number; estimatedSpendUsd: number }

type SpendReservationPayload = {
  allowed?: boolean
  actions_today?: number
  estimated_spend_usd?: number
  reason?: string
}

/**
 * Atomically reserves a daily spend slot via Postgres (row lock + counter).
 * Fails closed on database errors — prefer blocking over unbounded spend.
 */
export async function checkGriffinEyeSpendBreaker(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<SpendBreakerResult> {
  const { data, error } = await supabase.rpc('reserve_griffineye_daily_spend', {
    p_organization_id: organizationId,
    p_estimated_cost_usd: GRIFFINEYE_ESTIMATED_COST_USD,
    p_daily_cap_usd: GRIFFINEYE_DAILY_SPEND_CAP_USD,
  })

  if (error) {
    return {
      allowed: false,
      reason: 'GriffinEye spend safety check is temporarily unavailable. Try again shortly.',
      actionsToday: 0,
      estimatedSpendUsd: 0,
    }
  }

  const payload = (data ?? {}) as SpendReservationPayload
  const actionsToday = Number(payload.actions_today ?? 0)
  const estimatedSpendUsd = Number(payload.estimated_spend_usd ?? 0)

  if (!payload.allowed) {
    return {
      allowed: false,
      reason:
        payload.reason ??
        `Daily GriffinEye spend limit reached for this organization ($${GRIFFINEYE_DAILY_SPEND_CAP_USD.toFixed(2)} estimated cap).`,
      actionsToday,
      estimatedSpendUsd,
    }
  }

  return { allowed: true, actionsToday, estimatedSpendUsd }
}
