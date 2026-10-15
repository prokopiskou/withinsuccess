import { NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Προστατεύεται από το login του dashboard (src/proxy.ts → /api/dashboard/*)
// Επιστρέφει τις ερωτήσεις των online συμμετεχόντων + πόσα εισιτήρια πουλήθηκαν.
export async function GET() {
  try {
    const stripe = getStripeClient()
    const since = Math.floor(new Date('2026-10-01T00:00:00+03:00').getTime() / 1000)

    const questions: { at: string; name: string; question: string }[] = []
    let live = 0
    let online = 0

    for await (const s of stripe.checkout.sessions.list({ created: { gte: since }, status: 'complete', limit: 100 })) {
      const product = s.metadata?.product
      if (product === 'seminar_live') { live++; continue }
      if (product !== 'seminar_online') continue
      online++

      const fields = s.custom_fields || []
      const q = fields.find(f => f.key === 'question')?.text?.value?.trim() || ''
      const mode = fields.find(f => f.key === 'qname')?.dropdown?.value || 'anonymous'
      if (!q) continue
      const first = (s.customer_details?.name || '').trim().split(/\s+/)[0] || ''
      questions.push({
        at: new Date(s.created * 1000).toISOString(),
        name: mode === 'firstname' && first ? first : 'Ανώνυμα',
        question: q,
      })
    }

    questions.sort((a, b) => a.at.localeCompare(b.at))
    return NextResponse.json({ success: true, sold: { live, online }, questions })
  } catch (err) {
    console.error('seminar-questions failed:', err)
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 })
  }
}
