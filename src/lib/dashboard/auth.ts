import { createHmac } from 'crypto'
import { SESSION_DURATION_DAYS } from '@/lib/dashboard/sessionConstants'

export { SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from '@/lib/dashboard/sessionConstants'

/**
 * Create a signed session token.
 * Format: base64(timestamp:signature)
 * Signature: HMAC-SHA256(timestamp, secret)
 */
export function createSessionToken(): string {
  const secret = process.env.DASHBOARD_SESSION_SECRET
  if (!secret) throw new Error('DASHBOARD_SESSION_SECRET not configured')

  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', secret).update(timestamp).digest('hex')
  const token = `${timestamp}:${signature}`
  return Buffer.from(token).toString('base64')
}

/**
 * Get cookie options for the session.
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60, // seconds
  }
}
