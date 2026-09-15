import type { SupabaseClient } from '@supabase/supabase-js'
import type { GriffinCreditPackKey } from '@/lib/griffin-credit-packs'

export type CreditPurchaseRow = {
  id: string
  packKey: GriffinCreditPackKey
  packName: string
  credits: number
  amountCents: number
  currency: string
  createdAt: string
}

const PACK_LABELS: Record<GriffinCreditPackKey, string> = {
  starter: 'Starter pack',
  standard: 'Standard pack',
  bulk: 'Bulk pack',
}

export async function getCreditPurchaseHistory(
  supabase: SupabaseClient,
  organizationId: string,
  limit = 20,
): Promise<CreditPurchaseRow[]> {
  const { data, error } = await supabase
    .from('ai_credit_transactions')
    .select('id, pack_key, credits_delta, amount_cents, currency, created_at')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'purchase')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const packKey = row.pack_key as GriffinCreditPackKey
    return {
      id: row.id,
      packKey,
      packName: PACK_LABELS[packKey] ?? packKey,
      credits: row.credits_delta,
      amountCents: row.amount_cents ?? 0,
      currency: row.currency ?? 'usd',
      createdAt: row.created_at,
    }
  })
}
