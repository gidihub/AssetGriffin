import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  // A simple mistake could make it very hard to debug issues with
  // users being randomly logged out.
  const { data: { user } } = await supabase.auth.getUser()

  // Add route protection here once you have protected routes, e.g.:
  // if (!user && request.nextUrl.pathname.startsWith('/app')) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/login'
  //   return NextResponse.redirect(url)
  // }

  // IMPORTANT: return supabaseResponse as-is (or a copy of its cookies)
  // so the refreshed session cookies actually make it to the browser.
  return supabaseResponse
}
