/** Map Supabase auth errors to clearer user-facing messages. */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many signup or login attempts right now. Wait about an hour and try again, or disable email confirmation in Supabase for local dev (Authentication → Providers → Email).'
  }

  if (lower.includes('invalid email')) {
    return 'That email address is not accepted. Use a real email domain (e.g. Gmail), not a placeholder like @example.com.'
  }

  if (lower.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }

  return message
}
