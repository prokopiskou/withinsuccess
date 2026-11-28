import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GROUP_30DAYS = '148420836003415194'
const ML = 'https://connect.mailerlite.com/api'

/**
 * Αγοραστές 30 Μερών που ΔΕΝ μπήκαν στον αυτοματισμό του group (π.χ. ήταν unsubscribed τη στιγμή που μπήκαν).
 * GET  ?since=YYYY-MM-DD → ποιοι λείπουν από τον αυτοματισμό (καμία αλλαγή)
 * POST ?since=YYYY-MM-DD → τους βγάζει και τους ξαναβάζει στο group, ώστε να ξεκινήσει ο αυτοματισμός
 * Προστατεύεται από το proxy.ts (/api/dashboard/*).
 */
const key = () => {
  if (!process.env.MAILERLITE_API_KEY) throw new Error('Λείπει MAILERLITE_API_KEY')
  return process.env.MAILERLITE_API_KEY
}
async function ml(path: string, init?: RequestInit) {
  const r = await fetch(`${ML}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key()}`, Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const text = await r.text()
  return { ok: r.ok, status: r.status, json: text ? JSON.parse(text) : null }
}

/** Αυτοματισμοί που ξεκινάνε όταν κάποιος μπαίνει στο group των 30 Μερών */
async function groupAutomations() {
  const r = await ml('/automations?limit=100')
  if (!r.ok) throw new Error(`MailerLite automations ${r.status}`)
  const all = (r.json?.data || []) as { id: string; name: string; enabled?: boolean; triggers?: unknown }[]
  return all.filter(a => JSON.stringify(a.triggers || '').includes(GROUP_30DAYS)).map(a => ({ id: a.id, name: a.name, enabled: a.enabled }))
}

/** Όλα τα emails που έχουν περάσει (ή περνάνε) από τον αυτοματισμό */
async function automationEmails(id: string) {
  const set = new Set<string>()
  for (const status of ['completed', 'active', 'canceled', 'failed']) {
    for (let page = 1; page <= 50; page++) {
      const r = await ml(`/automations/${id}/activity?filter[status]=${status}&limit=100&page=${page}`)
      if (!r.ok) break
      const rows = (r.json?.data || []) as { subscriber?: { email?: string } }[]
      rows.forEach(x => x.subscriber?.email && set.add(x.subscriber.email.toLowerCase()))
      if (rows.length < 100) break
    }
  }
  return set
}

async function buyersSince(since: string) {
  const stripe = getStripeClient()
  const gte = Math.floor(new Date(`${since}T00:00:00+02:00`).getTime() / 1000)
  const emails = new Set<string>()
  for await (const s of stripe.checkout.sessions.list({ created: { gte }, status: 'complete', limit: 100 })) {
    const e = (s.customer_details?.email || s.customer_email || '').toLowerCase().trim()
    if (e) emails.add(e)
  }
  return emails
}

async function plan(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since') || '2026-11-20'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error('since=YYYY-MM-DD')
  const automations = await groupAutomations()
  if (!automations.length) throw new Error('Δεν βρέθηκε αυτοματισμός που ξεκινάει από το group 30 Μέρες')
  const inAutomation = new Set<string>()
  for (const a of automations) (await automationEmails(a.id)).forEach(e => inAutomation.add(e))
  const buyers = await buyersSince(since)
  const missing: { id: string; email: string }[] = []
  for (const email of buyers) {
    if (inAutomation.has(email)) continue
    const r = await ml(`/subscribers/${encodeURIComponent(email)}`)
    const s = r.json?.data
    if (!r.ok || !s) continue
    const inGroup = (s.groups || []).some((g: { id: string }) => String(g.id) === GROUP_30DAYS)
    if (inGroup && s.status === 'active') missing.push({ id: String(s.id), email })
  }
  return { since, automations, buyers: buyers.size, missing }
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
    for (const s of p.missing) {
      const out = await ml(`/subscribers/${s.id}/groups/${GROUP_30DAYS}`, { method: 'DELETE' })
      let back = await ml(`/subscribers/${s.id}/groups/${GROUP_30DAYS}`, { method: 'POST' })
      // Ποτέ να μη μείνει αγοραστής εκτός group
      if (!back.ok) back = await ml(`/subscribers/${s.id}/groups/${GROUP_30DAYS}`, { method: 'POST' })
      ;(out.ok && back.ok ? done : failed).push(s.email)
    }
    return NextResponse.json({ since: p.since, automations: p.automations, retriggered: done, failed })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
