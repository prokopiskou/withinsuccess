import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'
import { SEMINAR } from '@/lib/seminar'

// Επιστρέφει μόνο πόσα εισιτήρια πληρώθηκαν σε ένα checkout της Συζήτησης.
// Καμία προσωπική πληροφορία· χρησιμοποιείται από το thank-you για τη σωστή αξία στο Purchase.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: 'bad_id' }, { status: 400 })
  }
  try {
    const session = await getStripeClient().checkout.sessions.retrieve(id)
    const product = session.metadata?.product || ''
    if (session.payment_status !== 'paid' || !product.startsWith('seminar_')) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    const quantity = Math.max(1, Math.round((session.amount_total || 0) / (SEMINAR.priceEur * 100)))
    return NextResponse.json({ quantity, value: (session.amount_total || 0) / 100 })
  } catch {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
}
