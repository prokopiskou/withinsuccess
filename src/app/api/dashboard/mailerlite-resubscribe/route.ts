import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GROUP_30DAYS = '148420836003415194'
const ML = 'https://connect.mailerlite.com/api'

/**
 * Αγοραστές των 30 Μερών που είναι unsubscribed (άρα δεν παίρνουν τα emails του προγράμματος).
 * GET  → λίστα με την ημερομηνία που έκαναν unsubscribe (χωρίς αλλαγές)
 * POST { emails: [...] } → resubscribe ΜΟΝΟ όσων διαλέξεις.
 * Προσοχή: όποιος έκανε unsubscribe ΜΕΤΑ την αγορά το διάλεξε ο ίδιος — αυτόν τον αφήνουμε.
 * Προστατεύεται από το proxy.ts (/api/dashboard/*).
 */
async function unsubscribed(group: string) {
  const key = process.env.MAILERLITE_API_KEY
  if (!key) throw new Error('Λείπει MAILERLITE_API_KEY')
  const out: { email: string; unsubscribed_at: string | null; subscribed_at: string | null }[] = []
  let cursor: string | null = null
  for (let i = 0; i < 20; i++) {
    const url: string = `${ML}/groups/${group}/subscribers?filter[status]=unsubscribed&limit=500${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
    const r: Response = await fetch(url, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } })
    if (!r.ok) throw new Error(`MailerLite ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const j: { data?: { email: string; unsubscribed_at?: string; subscribed_at?: string }[]; meta?: { next_cursor?: string } } = await r.json()
    for (const s of j.data || []) out.push({ email: s.email, unsubscribed_at: s.unsubscribed_at ?? null, subscribed_at: s.subscribed_at ?? null })
    cursor = j.meta?.next_cursor || null
    if (!cursor) break
  }
  return out
}

export async function GET(req: NextRequest) {
  try {
    const group = req.nextUrl.searchParams.get('group') || GROUP_30DAYS
    const list = await unsubscribed(group)
    return NextResponse.json({ group, count: list.length, subscribers: list })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const group = req.nextUrl.searchParams.get('group') || GROUP_30DAYS
    const body = await req.json().catch(() => ({}))
    const wanted = new Set<string>((Array.isArray(body.emails) ? body.emails : []).map((e: string) => String(e).toLowerCase().trim()))
    if (!wanted.size) return NextResponse.json({ error: 'Δώσε emails: [...]' }, { status: 400 })
    const list = (await unsubscribed(group)).filter(s => wanted.has(s.email.toLowerCase()))
    const done: string[] = []
    const failed: string[] = []
    for (const s of list) {
      const r = await fetch(`${ML}/subscribers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: s.email, groups: [group], status: 'active', resubscribe: true }),
      })
      ;(r.ok ? done : failed).push(s.email)
    }
    return NextResponse.json({ group, resubscribed: done, failed })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
