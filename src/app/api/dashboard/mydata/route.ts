import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'
import { canIssueFromDashboard, cancelDoc, issueReceipt, mydataConfig, retryDoc, toVatRate } from '@/lib/mydata'

export const dynamic = 'force-dynamic'

/** Παραστατικά (με φίλτρα) + ρυθμίσεις χωρίς κλειδιά */
export async function GET(req: NextRequest) {
  const c = mydataConfig()
  const p = req.nextUrl.searchParams
  if (p.get('id')) {
    const { data: doc } = await supabaseAdmin.from('mydata_docs').select('*').eq('id', p.get('id')!).maybeSingle()
    return NextResponse.json({ doc, config: { env: c.env, vat: c.vat } })
  }
  let q = supabaseAdmin.from('mydata_docs').select('*').eq('env', c.env).order('created_at', { ascending: false }).limit(1000)
  if (p.get('from')) q = q.gte('issue_date', p.get('from')!)
  if (p.get('to')) q = q.lte('issue_date', p.get('to')!)
  const { data, error } = await q
  return NextResponse.json({
    config: {
      env: c.env,
      configured: c.configured,
      live: c.live,
      canIssue: canIssueFromDashboard(),
      vat: c.vat,
      series: c.series,
      creditSeries: c.creditSeries,
      vatExemption: c.vatExemption,
    },
    docs: data || [],
    dbError: error?.message || null,
  })
}

/** Ενέργειες ταμείου: issue | credit | retry | cancel */
export async function POST(req: NextRequest) {
  if (!canIssueFromDashboard()) {
    return NextResponse.json({ error: 'Η έκδοση από το dashboard είναι κλειστή (παραγωγή χωρίς MYDATA_LIVE=1)' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  try {
    switch (body.action) {
      case 'issue': {
        const quantity = Math.max(1, Math.min(999, Math.round(Number(body.quantity) || 1)))
        const unitPrice = Number(body.unitPrice ?? body.amount)
        if (!(unitPrice > 0 && unitPrice < 100000)) return NextResponse.json({ error: 'Μη έγκυρη τιμή' }, { status: 400 })
        const amount = Math.round(unitPrice * quantity * 100) / 100
        const doc = await issueReceipt({
          amount,
          unitPrice,
          quantity,
          paymentType: Number(body.paymentType) || 7,
          product: String(body.product || 'Υπηρεσίες').slice(0, 200),
          description: String(body.product || 'Υπηρεσίες').slice(0, 200),
          customerName: body.customerName ? String(body.customerName).slice(0, 200) : null,
          customerEmail: body.customerEmail ? String(body.customerEmail).slice(0, 200) : null,
          externalRef: `manual_${Date.now()}`,
          source: 'manual',
          vatRate: toVatRate(body.vatRate),
        })
        return NextResponse.json({ doc })
      }
      case 'credit': {
        const { data: orig } = await supabaseAdmin.from('mydata_docs').select('*').eq('id', body.id).single()
        if (!orig?.mark) return NextResponse.json({ error: 'Η αρχική απόδειξη δεν έχει MARK' }, { status: 400 })
        if (orig.doc_type !== '11.2') return NextResponse.json({ error: 'Πιστωτικό μόνο για ΑΠΥ' }, { status: 400 })
        const doc = await issueReceipt({
          amount: Number(orig.amount),
          unitPrice: Number(orig.unit_price ?? orig.amount),
          quantity: orig.quantity || 1,
          paymentType: orig.payment_type,
          product: orig.product,
          description: `Πιστωτικό για ${orig.series} ${orig.aa}`,
          customerName: orig.customer_name,
          customerEmail: orig.customer_email,
          externalRef: `credit_${orig.id}`,
          correlatedMark: orig.mark,
          source: 'manual',
          vatRate: toVatRate(orig.vat_rate),
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
