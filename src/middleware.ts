import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/dashboard/sessionConstants'
import { verifySessionToken } from '@/lib/dashboard/sessionVerify'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Don't protect the login page itself or auth API routes
  if (
    pathname.startsWith('/dashboard/login') ||
    pathname.startsWith('/api/dashboard/auth')
  ) {
    return NextResponse.next()
  }

  // Check session cookie (verify uses Web Crypto — Edge-safe)
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!(await verifySessionToken(sessionCookie))) {
    if (pathname.startsWith('/api/dashboard/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/dashboard/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Match /dashboard and all /api/dashboard routes (except auth routes which we early-return above)
export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*'],
}
