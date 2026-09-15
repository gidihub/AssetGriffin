import { AUDIT_CATEGORIES, type AuditCategory, type DbAuditLogRow } from '@/lib/griffineye-audit'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export async function GET(request: Request) {
  try {
    const { supabase, profile } = await requireUserProfile()

    const params = new URL(request.url).searchParams
    const requested = params.get('category')
    const category = AUDIT_CATEGORIES.includes(requested as AuditCategory)
      ? (requested as AuditCategory)
      : null

    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(params.get('limit')) || DEFAULT_LIMIT))
    const entityId = params.get('entity_id')?.trim() || null

    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    if (entityId) {
      query = query.eq('entity_id', entityId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const events = (data ?? []) as DbAuditLogRow[]

    // Tab badges need totals per category without loading every row.
    const countResults = await Promise.all(
      AUDIT_CATEGORIES.map(async (name) => {
        const { count, error: countError } = await supabase
          .from('audit_log')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .eq('category', name)

        if (countError) throw new Error(countError.message)
        return [name, count ?? 0] as const
      }),
    )

    const counts = Object.fromEntries(countResults) as Record<AuditCategory, number>

    return Response.json({ events, counts })
  } catch (error) {
    console.error('[audit-log]', error)
    const message = error instanceof Error ? error.message : 'Could not load the activity timeline.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
