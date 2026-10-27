import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Προστατεύεται από το login του dashboard (src/proxy.ts → /api/dashboard/*).
// Δείχνει τα IDs που χρειάζονται για την έκδοση ΑΠΥ στο Oxygen (σειρές αρίθμησης, ΦΠΑ, τρόποι πληρωμής).
// Δεν επιστρέφει ποτέ το API key.
export async function GET() {
  const key = process.env.OXYGEN_API_KEY
  if (!key) return NextResponse.json({ ok: false, error: 'OXYGEN_API_KEY λείπει' })
  const base = 'https://api.oxygen.gr/v1'
  const get = async (path: string) => {
    try {
      const r = await fetch(`${base}${path}?per_page=200`, {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
        cache: 'no-store',
      })
      const body = await r.json().catch(() => null)
      return { status: r.status, data: body?.data ?? body }
    } catch (e) {
      return { status: 0, data: String(e) }
    }
  }
  const [sequences, taxes, paymentMethods] = await Promise.all([
    get('/numbering-sequences'),
    get('/taxes'),
    get('/payment-methods'),
  ])
  return NextResponse.json({ ok: true, sequences, taxes, paymentMethods })
}
