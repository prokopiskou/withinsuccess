import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GROUP_30DAYS = '148420836003415194'
const ML = 'https://connect.mailerlite.com/api'
const DEFAULT_SINCE = '2026-11-20'

/**
 * Αγοραστές των 30 Μερών (από το Stripe, μετά από ημερομηνία) που στο MailerLite είναι unsubscribed
 * και άρα δεν παίρνουν τα emails του προγράμματος.
 *
 * GET  ?since=YYYY-MM-DD → ποιοι θα γίνουν resubscribe και ποιοι εξαιρούνται (καμία αλλαγή)
 * POST ?since=YYYY-MM-DD → resubscribe
 *
 * Εξαιρούνται όσοι έκαναν unsubscribe ΜΕΤΑ την αγορά τους (το επέλεξαν οι ίδιοι).
 * Προστατεύεται από το proxy.ts (/api/dashboard/*).
 */
type Unsub = { email: string; unsubscribed_at: string | null }

async function unsubscribedInGroup(group: string): Promise<Unsub[]> {
  const key = process.env.MAILERLITE_API_KEY
  if (!key) throw new Error('Λείπει MAILERLITE_API_KEY')
  const out: Unsub[] = []
  let cursor: string | null = null
  for (let i = 0; i < 20; i++) {
    const url: string = `${ML}/groups/${group}/subscribers?filter[status]=unsubscribed&limit=500${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
    const r: Response = await fetch(url, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } })
    if (!r.ok) throw new Error(`MailerLite ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const j: { data?: { email: string; unsubscribed_at?: string }[]; meta?: { next_cursor?: string } } = await r.json()
    for (const s of j.data || []) out.push({ email: s.email.toLowerCase(), unsubscribed_at: s.unsubscribed_at ?? null })
    cursor = j.meta?.next_cursor || null
    if (!cursor) break
  }
  return out
}

/** email → πρώτη αγορά (ms) από ολοκληρωμένα Stripe Checkout μετά το since */
async function buyersSince(since: string) {
  const stripe = getStripeClient()
  const gte = Math.floor(new Date(`${since}T00:00:00+02:00`).getTime() / 1000)
  const map = new Map<string, number>()
  for await (const s of stripe.checkout.sessions.list({ created: { gte }, status: 'complete', limit: 100 })) {
    const email = (s.customer_details?.email || s.customer_email || '').toLowerCase().trim()
    if (!email) continue
    const t = s.created * 1000
    if (!map.has(email) || t < map.get(email)!) map.set(email, t)
  }
  return map
}

async function plan(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since') || DEFAULT_SINCE
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error('since=YYYY-MM-DD')
  const [unsubs, buyers] = await Promise.all([unsubscribedInGroup(GROUP_30DAYS), buyersSince(since)])
  const resubscribe: { email: string; bought: string; unsubscribed_at: string | null }[] = []
  const skipped: { email: string; reason: string }[] = []
  for (const u of unsubs) {
    const bought = buyers.get(u.email)
    if (!bought) continue // δεν αγόρασε μετά το since → δεν τον αγγίζουμε
    const unsubAt = u.unsubscribed_at ? new Date(u.unsubscribed_at.replace(' ', 'T') + 'Z').getTime() : 0
    if (unsubAt > bought) skipped.push({ email: u.email, reason: 'έκανε unsubscribe μετά την αγορά' })
    else resubscribe.push({ email: u.email, bought: new Date(bought).toISOString(), unsubscribed_at: u.unsubscribed_at })
  }
  return { since, unsubscribedInGroup: unsubs.length, resubscribe, skipped }
}

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await plan(req))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const p = await plan(req)
    const done: string[] = []
    const failed: string[] = []
    for (const s of p.resubscribe) {
      const r = await fetch(`${ML}/subscribers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: s.email, groups: [GROUP_30DAYS], status: 'active', resubscribe: true }),
      })
      ;(r.ok ? done : failed).push(s.email)
    }
    return NextResponse.json({ since: p.since, resubscribed: done, failed, skipped: p.skipped })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
