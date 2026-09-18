import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveSafeRedirect } from '@/lib/safe-redirect'

const PROTECTED_PAGE_PREFIXES = ['/app']
const PROTECTED_API_PREFIXES = [
  '/api/griffin-extract',
  '/api/griffin-vision',
  '/api/assets',
  '/api/billing',
]
const AUTH_PAGES = ['/login']

function isProtectedPath(pathname: string) {
  return (
    PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
}

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * Refreshes the Supabase auth session on every request and keeps the
 * browser + server cookies in sync. Called from `proxy.ts` (the renamed
 * `middleware.ts` convention in this Next.js version).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && isProtectedPath(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage(pathname)) {
    const redirectTo = resolveSafeRedirect(request.nextUrl.searchParams.get('redirect') ?? '/app')
    const url = request.nextUrl.clone()
    const parsed = new URL(redirectTo, request.nextUrl.origin)
    url.pathname = parsed.pathname
    url.search = parsed.search
    url.hash = parsed.hash
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
