import { NextResponse } from 'next/server'

// ============================================================
// Βασική προστασία για τα δημόσια form endpoints (contact / apply / waitlist)
// 1. Origin check: δέχεται μόνο αιτήματα από το δικό μας site
// 2. Rate limit ανά IP (in-memory, ανά serverless instance — best effort)
// ============================================================

const ALLOWED_HOSTS = ['withinsuccess.gr', 'www.withinsuccess.gr', 'localhost', '127.0.0.1']

function hostAllowed(url: string | null): boolean {
  if (!url) return false
  try {
    const host = new URL(url).hostname
    return ALLOWED_HOSTS.includes(host) || host.endsWith('.vercel.app')
  } catch {
    return false
  }
}

const buckets = new Map<string, number[]>()

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Επιστρέφει NextResponse αν το αίτημα πρέπει να μπλοκαριστεί, αλλιώς null.
 * @param key   όνομα endpoint (ξεχωριστό όριο ανά endpoint)
 * @param limit μέγιστα αιτήματα ανά IP μέσα στο παράθυρο
 * @param windowMs παράθυρο σε ms
 */
export function guardFormRequest(
  req: Request,
  key: string,
  limit = 5,
  windowMs = 10 * 60 * 1000,
): NextResponse | null {
  // 1. Origin / Referer από το δικό μας domain
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  if (!hostAllowed(origin) && !hostAllowed(referer)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limit ανά IP + endpoint
  const now = Date.now()
  const id = `${key}:${clientIp(req)}`
  const hits = (buckets.get(id) || []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    return NextResponse.json(
      { error: 'Πολλές προσπάθειες. Δοκίμασε ξανά σε λίγα λεπτά.' },
      { status: 429 },
    )
  }
  hits.push(now)
  buckets.set(id, hits)

  // Μικρό housekeeping ώστε το Map να μη μεγαλώνει απεριόριστα
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k)
    }
  }
  return null
}

/** Κόβει strings σε λογικό μήκος (προστασία από τεράστια payloads). */
export function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

/** HTML escape για τιμές χρήστη μέσα σε HTML emails (αποτρέπει injection links/HTML). */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
