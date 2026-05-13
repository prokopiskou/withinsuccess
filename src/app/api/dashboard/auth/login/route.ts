import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/dashboard/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const expected = process.env.DASHBOARD_PASSWORD

    if (!expected) {
      return NextResponse.json(
        { success: false, error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    if (typeof password !== 'string' || password !== expected) {
      return NextResponse.json(
        { success: false, error: 'Λάθος password' },
        { status: 401 }
      )
    }

    const token = createSessionToken()
    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())
    return response
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}
