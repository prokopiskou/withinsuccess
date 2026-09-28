import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripeClient'
import { sendTikTokEvent } from '@/lib/tiktokEvents'

// ============================================================
// TikTok backfill: στέλνει τις πρόσφατες ολοκληρωμένες αγορές του 30days
// από το Stripe ως Purchase στο TikTok Events API.
// - event_time = η πραγματική ώρα αγοράς
// - event_id = session.id (ίδιο με το webhook → καμία διπλοεγγραφή)
// Auth: Authorization: Bearer <CRON_SECRET>
// Χρήση: GET /api/admin/tiktok-backfill?days=7&dry=1  (dry=1 → μόνο μέτρηση)
// Η απάντηση ΔΕΝ περιέχει προσωπικά δεδομένα.
// ============================================================

const PRODUCT_ID_30DAYS = 'prod_Rxeqpm5IWwBxef'

export const maxDuration = 300

function productIdOf(item: Stripe.LineItem): string {
  const p = item.price?.product
  return typeof p === 'string' ? p : (p as Stripe.Product | undefined)?.id || ''
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7', 10) || 7, 1), 28)
  const dry = url.searchParams.get('dry') === '1'
  const since = Math.floor(Date.now() / 1000) - days * 86400

  const stripe = getStripeClient()
  const summary = { days, dry, scanned: 0, matched30days: 0, sent: 0, failed: 0, errors: [] as string[] }

  for await (const s of stripe.checkout.sessions.list({
    created: { gte: since },
    status: 'complete',
    limit: 100,
    expand: ['data.line_items'],
  })) {
    summary.scanned++
    if (s.payment_status !== 'paid') continue
    const items = s.line_items?.data || []
    const is30 = items.some(i => productIdOf(i) === PRODUCT_ID_30DAYS) || s.metadata?.product === '30days'
    if (!is30) continue
    summary.matched30days++
    if (dry) continue

    const meta = (s.metadata || {}) as Record<string, string>
    const r = await sendTikTokEvent({
      event: 'Purchase',
      eventId: s.id,
      eventTime: s.created,
      value: (s.amount_total || 0) / 100,
      contentId: '30days-program',
      contentName: '30 Μέρες',
      pageUrl: 'https://withinsuccess.gr/30days',
      email: s.customer_details?.email || s.customer_email || null,
      phone: s.customer_details?.phone || null,
      ttclid: meta.ttclid || null,
      ttp: meta.ttp || null,
      ip: meta.client_ip_address || null,
      userAgent: meta.client_user_agent || null,
    })
    if (r.ok) summary.sent++
    else {
      summary.failed++
      if (summary.errors.length < 5) summary.errors.push(`${r.code ?? ''} ${r.message ?? ''}`.trim())
    }
  }

  return NextResponse.json(summary)
}
