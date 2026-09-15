const DEFAULT_REDIRECT = '/app'

/** Resolve a same-origin path from user input; rejects open redirects. */
export function resolveSafeRedirect(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return DEFAULT_REDIRECT

  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || /[\0\\]/.test(trimmed)) {
    return DEFAULT_REDIRECT
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  let resolved: URL
  try {
    resolved = new URL(trimmed, base)
  } catch {
    return DEFAULT_REDIRECT
  }

  try {
    if (resolved.origin !== new URL(base).origin) return DEFAULT_REDIRECT
  } catch {
    return DEFAULT_REDIRECT
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}` || DEFAULT_REDIRECT
}

export function loginPageUrl(options: {
  error?: string
  message?: string
  redirect?: string
  mode?: 'signin' | 'signup'
}): string {
  const params = new URLSearchParams()
  if (options.error) params.set('error', options.error)
  if (options.message) params.set('message', options.message)
  if (options.redirect) params.set('redirect', options.redirect)
  if (options.mode) params.set('mode', options.mode)
  const query = params.toString()
  return query ? `/login?${query}` : '/login'
}
