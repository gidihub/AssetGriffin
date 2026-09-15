import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { loginPageUrl, resolveSafeRedirect } from '@/lib/safe-redirect'

// Handles email confirmation links from Supabase signup (PKCE code or token_hash flows).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = resolveSafeRedirect(searchParams.get('next') ?? '/app')

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(next)
    }
    redirect(loginPageUrl({ error: 'Invalid or expired confirmation link. Request a new one from sign in.' }))
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      redirect(next)
    }
    redirect(loginPageUrl({ error: 'Invalid or expired confirmation link. Request a new one from sign in.' }))
  }

  redirect(loginPageUrl({ error: 'Invalid or expired confirmation link. Request a new one from sign in.' }))
}
