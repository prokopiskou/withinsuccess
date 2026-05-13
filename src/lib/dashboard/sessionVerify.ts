import { SESSION_DURATION_DAYS } from '@/lib/dashboard/sessionConstants'

function base64UrlToUtf8(b64: string): string {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  const bytes = new Uint8Array(sig)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

/**
 * Verify session token (Edge-safe: Web Crypto only).
 * Must stay compatible with tokens issued by createSessionToken() in auth.ts.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false

  const secret = process.env.DASHBOARD_SESSION_SECRET
  if (!secret) return false

  try {
    const decoded = base64UrlToUtf8(token)
    const [timestamp, signature] = decoded.split(':')
    if (!timestamp || !signature) return false

    const expectedSig = await hmacSha256Hex(secret, timestamp)
    if (signature.length !== expectedSig.length || signature !== expectedSig) {
      return false
    }

    const ageMs = Date.now() - parseInt(timestamp, 10)
    const maxAgeMs = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    if (Number.isNaN(ageMs) || ageMs < 0 || ageMs > maxAgeMs) return false

    return true
  } catch {
    return false
  }
}
