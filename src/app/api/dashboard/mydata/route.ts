import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'
import { cancelDoc, issueReceipt, mydataConfig, retryDoc } from '@/lib/mydata'

export const dynamic = 'force-dynamic'

/** Λίστα παραστατικών + ρυθμίσεις (χωρίς κλειδιά) */
export async function GET() {
  const c = mydataConfig()
  const { data, error } = await supabaseAdmin
    .from('mydata_docs')
    .select('*')
    .eq('env', c.env)
    .order('created_at', { ascending: false })
    .limit(100)
  return NextResponse.json({
    config: { env: c.env, configured: c.configured, vat: c.vat, series: c.series, creditSeries: c.creditSeries, vatExemption: c.vatExemption },
    docs: data || [],
    dbError: error?.message || null,
  })
}

/**
 * Δοκιμές από το dashboard: issue | credit | retry | cancel
 * Επιτρέπεται ΜΟΝΟ στο δοκιμαστικό περιβάλλον, ώστε να μη βγει κατά λάθος πραγματική απόδειξη.
 */
export async function POST(req: NextRequest) {
  const c = mydataConfig()
  if (c.env !== 'dev') {
    return NextResponse.json({ error: 'Οι δοκιμές από το dashboard επιτρέπονται μόνο σε MYDATA_ENV=dev' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  try {
    switch (body.action) {
      case 'issue': {
        const amount = Number(body.amount)
        if (!(amount > 0 && amount < 10000)) return NextResponse.json({ error: 'Μη έγκυρο ποσό' }, { status: 400 })
        const doc = await issueReceipt({
          amount,
          paymentType: Number(body.paymentType) || 7,
          description: String(body.description || '30 Μέρες Μεταμόρφωσης').slice(0, 200),
          customerEmail: body.customerEmail ? String(body.customerEmail).slice(0, 200) : null,
          externalRef: `test_${Date.now()}`,
        })
        return NextResponse.json({ doc })
      }
      case 'credit': {
        const { data: orig } = await supabaseAdmin.from('mydata_docs').select('*').eq('id', body.id).single()
        if (!orig?.mark) return NextResponse.json({ error: 'Η αρχική απόδειξη δεν έχει MARK' }, { status: 400 })
        const doc = await issueReceipt({
          amount: Number(orig.amount),
          paymentType: orig.payment_type,
          description: `Πιστωτικό για ${orig.series} ${orig.aa}`,
          customerEmail: orig.customer_email,
          externalRef: `credit_${orig.id}`,
          correlatedMark: orig.mark,
        })
        return NextResponse.json({ doc })
      }
      case 'retry':
        return NextResponse.json({ doc: await retryDoc(String(body.id)) })
      case 'cancel': {
        const { data: d } = await supabaseAdmin.from('mydata_docs').select('mark').eq('id', body.id).single()
        if (!d?.mark) return NextResponse.json({ error: 'Χωρίς MARK' }, { status: 400 })
        const r = await cancelDoc(d.mark)
        if (r.ok) await supabaseAdmin.from('mydata_docs').update({ status: 'cancelled' }).eq('id', body.id)
        return NextResponse.json({ result: r }, { status: r.ok ? 200 : 400 })
      }
      default:
        return NextResponse.json({ error: 'Άγνωστη ενέργεια' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
