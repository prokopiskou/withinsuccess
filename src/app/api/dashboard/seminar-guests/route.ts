import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripeClient'
import { SEMINAR } from '@/lib/seminar'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Προστατεύεται από το login του dashboard (src/proxy.ts → /api/dashboard/*)
// Λίστα εισόδου: όλοι οι πληρωμένοι αγοραστές (χωρίς επιστροφές), με email, όνομα κάρτας και θέσεις.
export type Guest = { email: string; name: string; seats: number; ticket: 'live' | 'online'; at: string }

export async function GET() {
  try {
    const stripe = getStripeClient()
    const since = Math.floor(new Date('2026-10-01T00:00:00+03:00').getTime() / 1000)
    const unit = SEMINAR.priceEur * 100
    const guests: Guest[] = []

    for await (const s of stripe.checkout.sessions.list({
      created: { gte: since },
      status: 'complete',
      limit: 100,
      expand: ['data.payment_intent.latest_charge'],
    })) {
      const product = s.metadata?.product
      if (product !== 'seminar_live' && product !== 'seminar_online') continue
      if (s.payment_status !== 'paid') continue
      const pi = s.payment_intent as Stripe.PaymentIntent | null
      const charge = (pi?.latest_charge || null) as Stripe.Charge | null
      const paid = s.amount_total || 0
      const refunded = charge?.amount_refunded || 0
      const seats = Math.round((paid - refunded) / unit)
      if (seats <= 0) continue
      guests.push({
        email: (s.customer_details?.email || s.customer_email || '').toLowerCase(),
        name: (s.customer_details?.name || '').trim(),
        seats,
        ticket: product === 'seminar_live' ? 'live' : 'online',
        at: new Date(s.created * 1000).toISOString(),
      })
    }

    guests.sort((a, b) => a.email.localeCompare(b.email))
    const count = (t: Guest['ticket']) => guests.filter(g => g.ticket === t).reduce((n, g) => n + g.seats, 0)
    return NextResponse.json({ success: true, guests, totals: { live: count('live'), online: count('online') } })
  } catch (err) {
    console.error('seminar-guests failed:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
