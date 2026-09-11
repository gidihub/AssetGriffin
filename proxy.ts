import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Note: this project is on Next.js 16, where the `middleware.ts` file
// convention was renamed to `proxy.ts` (export name `proxy`, not `middleware`).
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any file with an extension (e.g. .svg, .png, .jpg)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
