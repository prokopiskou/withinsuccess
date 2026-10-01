import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripeClient'
import { firstNameVocative } from '@/lib/nameFixer'

// ============================================================
// Διόρθωση ονομάτων (κλητική) στο MailerLite για τους αγοραστές του 30days.
// Παίρνει το αρχικό όνομα από το Stripe, το ξαναβγάζει με τους νέους κανόνες
// και ενημερώνει ΜΟΝΟ όσους έχουν λάθος όνομα στο group του 30days.
// Auth: Authorization: Bearer <CRON_SECRET>
// Χρήση: GET /api/admin/fix-names?days=14&dry=1   (dry=1 → μόνο λίστα αλλαγών)
//        GET /api/admin/fix-names?days=14         (εφαρμογή)
// Η απάντηση δείχνει μόνο μικρά ονόματα (παλιό → νέο), όχι emails.
// ============================================================

const PRODUCT_ID_30DAYS = 'prod_Rxeqpm5IWwBxef'
const GROUP_30DAYS = '148420836003415194'
const ML = 'https://connect.mailerlite.com/api'

export const maxDuration = 300

function productIdOf(item: Stripe.LineItem): string {
  const p = item.price?.product
  return typeof p === 'string' ? p : (p as Stripe.Product | undefined)?.id || ''
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function mlFetch(url: string, init: RequestInit = {}, tries = 3): Promise<Response> {
  for (let t = 0; t < tries; t++) {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers || {}),
      },
    })
    if (res.status !== 429) return res
    const wait = (parseInt(res.headers.get('retry-after') || '5', 10) || 5) * 1000
    await sleep(wait)
  }
  return fetch(url, init)
}

type MLSub = { id: string; email: string; fields?: { name?: string | null } }

async function loadGroup(): Promise<Map<string, MLSub>> {
  const map = new Map<string, MLSub>()
  let url: string | null = `${ML}/groups/${GROUP_30DAYS}/subscribers?limit=1000`
  while (url) {
    const res = await mlFetch(url)
    if (!res.ok) throw new Error(`MailerLite group list ${res.status}`)
    const json = await res.json()
    for (const s of (json.data || []) as MLSub[]) map.set(s.email.toLowerCase(), s)
    url = json.links?.next || null
  }
  return map
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '14', 10) || 14, 1), 60)
  const dry = url.searchParams.get('dry') === '1'
  const since = Math.floor(Date.now() / 1000) - days * 86400

  const summary = {
    days, dry,
    buyers: 0, inGroup: 0, alreadyCorrect: 0, toChange: 0, updated: 0, failed: 0,
    changes: [] as string[],
    errors: [] as string[],
  }

  // 1. Αγοραστές 30days από το Stripe (email → αρχικό όνομα)
  const stripe = getStripeClient()
  const buyers = new Map<string, string>()
  for await (const s of stripe.checkout.sessions.list({
    created: { gte: since }, status: 'complete', limit: 100, expand: ['data.line_items'],
  })) {
    if (s.payment_status !== 'paid') continue
    const is30 = (s.line_items?.data || []).some(i => productIdOf(i) === PRODUCT_ID_30DAYS) || s.metadata?.product === '30days'
    if (!is30) continue
    const email = (s.customer_details?.email || s.customer_email || '').toLowerCase()
    const name = s.customer_details?.name || ''
    if (email && name && !buyers.has(email)) buyers.set(email, name)
  }
  summary.buyers = buyers.size

  // 2. Τρέχοντα ονόματα στο MailerLite
  let group: Map<string, MLSub>
  try {
    group = await loadGroup()
  } catch (e) {
    return NextResponse.json({ ...summary, error: String(e) }, { status: 502 })
  }

  // 3. Υπολογισμός νέων ονομάτων (5 παράλληλα)
  const work = [...buyers.entries()].filter(([email]) => group.has(email))
  summary.inGroup = work.length
  const planned: { sub: MLSub; from: string; to: string }[] = []
  for (let i = 0; i < work.length; i += 5) {
    const batch = work.slice(i, i + 5)
    const results = await Promise.all(batch.map(async ([email, raw]) => {
      const sub = group.get(email)!
      const to = await firstNameVocative(raw)
      return { sub, from: (sub.fields?.name || '').trim(), to }
    }))
    for (const r of results) {
      if (!r.to || r.to === r.from) summary.alreadyCorrect++
      else planned.push(r)
    }
  }
  summary.toChange = planned.length
  summary.changes = planned.map(p => `${p.from || '(κενό)'} → ${p.to}`)

  if (dry) return NextResponse.json(summary)

  // 4. Ενημέρωση (αργά, για το rate limit του MailerLite)
  for (const p of planned) {
    const res = await mlFetch(`${ML}/subscribers/${p.sub.id}`, {
      method: 'PUT',
      body: JSON.stringify({ fields: { name: p.to } }),
    })
    if (res.ok) summary.updated++
    else {
      summary.failed++
      if (summary.errors.length < 5) summary.errors.push(`${res.status}`)
    }
    await sleep(550)
  }

  return NextResponse.json(summary)
}
