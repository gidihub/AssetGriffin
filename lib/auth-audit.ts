import type { SupabaseClient } from '@supabase/supabase-js'

import { recordAuditEvent } from '@/lib/griffineye-audit'

/**
 * Records an account event in the User activity log.
 *
 * Takes the caller's client rather than building its own: during sign-in and
 * sign-up the session cookie has only just been written, so the client that
 * performed the auth call is the one guaranteed to be authenticated.
 *
 * Signing in or out must never fail because a log write did, so every error is
 * reported to the server console and swallowed.
 */
export async function recordAuthEvent(
  supabase: SupabaseClient,
  action: string,
  summary: string,
): Promise<void> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('[auth-audit] getUser failed for', action, userError.message)
      return
    }

    if (!user) {
      console.error('[auth-audit] no authenticated user for', action)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, email, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[auth-audit] profile lookup failed for', action, profileError.message)
      return
    }

    if (!profile) {
      console.error('[auth-audit] profile not found for', action, user.id)
      return
    }

    await recordAuditEvent(supabase, profile.organization_id, {
      category: 'user',
      action,
      source: 'manual',
      actorId: profile.id,
      actorLabel: profile.full_name || profile.email,
      entityType: 'Account',
      entityId: profile.id,
      entityLabel: profile.email,
      summary,
    })
  } catch (error) {
    console.error('[auth-audit] could not record', action, error)
  }
}
