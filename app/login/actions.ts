'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { formatAuthError } from '@/lib/auth-errors'
import { recordAuthEvent } from '@/lib/auth-audit'
import { createClient } from '@/lib/supabase/server'
import { loginPageUrl, resolveSafeRedirect } from '@/lib/safe-redirect'

export async function login(formData: FormData) {
  const rawRedirect = String(formData.get('redirect') ?? '')
  const redirectTo = resolveSafeRedirect(rawRedirect || '/app')

  const supabase = await createClient()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    redirect(loginPageUrl({ error: 'Email and password are required', redirect: redirectTo }))
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(loginPageUrl({ error: formatAuthError(error.message), redirect: redirectTo }))
  }

  await recordAuthEvent(supabase, 'Signed in', 'Signed in with email and password.')

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    redirect(loginPageUrl({ error: 'Email and password are required', mode: 'signup' }))
  }

  if (password.length < 6) {
    redirect(loginPageUrl({ error: 'Password must be at least 6 characters', mode: 'signup' }))
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined)
  if (!siteUrl) {
    redirect(loginPageUrl({ error: 'Site URL is not configured. Set NEXT_PUBLIC_SITE_URL.', mode: 'signup' }))
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  })

  if (error) {
    redirect(loginPageUrl({ error: formatAuthError(error.message), mode: 'signup' }))
  }

  if (data.session) {
    await recordAuthEvent(supabase, 'Created account', 'Signed up and started a new workspace.')
    revalidatePath('/', 'layout')
    redirect('/app')
  }

  redirect(
    loginPageUrl({
      message:
        'Account created. Check your email for a confirmation link — click it to activate your account, then sign in here.',
      mode: 'signup',
    }),
  )
}

export async function logout() {
  const supabase = await createClient()
  // Logged before signing out — afterwards RLS would reject the insert.
  await recordAuthEvent(supabase, 'Signed out', 'Signed out of the workspace.')
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
