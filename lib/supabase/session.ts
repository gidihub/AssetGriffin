import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type UserProfile = {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  role: string
  job_title: string | null
  timezone: string
  preferences: Record<string, unknown>
}

/** Deduplicated per request — safe to call from routes and db helpers. */
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return { supabase, user }
})

/** Deduplicated per request — one auth round trip per API handler. */
export const requireUserProfile = cache(async () => {
  const { supabase, user } = await requireUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, organization_id, email, full_name, role, job_title, timezone, preferences')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('Profile not found for authenticated user')
  }

  return { supabase, user, profile: profile as UserProfile }
})
