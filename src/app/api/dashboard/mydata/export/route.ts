import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'
import { mydataConfig } from '@/lib/mydata'

export const dynamic = 'force-dynamic'

const PAY: Record<number, string> = { 7: 'Κάρτα POS/e-POS', 8: 'IRIS', 6: 'Web banking', 3: 'Μετρητά', 1: 'Τραπεζικός λογαριασμός' }

/** CSV για τον λογιστή (ανοίγει στο Excel με ελληνικά) */
export async function GET(req: NextRequest) {
  const c = mydataConfig()
  const p = req.nextUrl.searchParams
  let q = supabaseAdmin.from('mydata_docs').select('*').eq('env', c.env).order('issue_date').order('aa')
  if (p.get('from')) q = q.gte('issue_date', p.get('from')!)
  if (p.get('to')) q = q.lte('issue_date', p.get('to')!)
  const { data } = await q
  const head = ['Ημερομηνία', 'Τύπος', 'Σειρά', 'Αριθμός', 'Πελάτης', 'Email', 'Περιγραφή', 'Ποσότητα', 'Τιμή', 'Σύνολο', 'Πληρωμή', 'Κατάσταση', 'MARK', 'Σχετικό MARK']
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = (data || []).map(d => [
    d.issue_date,
    d.doc_type === '11.4' ? 'Πιστωτικό 11.4' : 'ΑΠΥ 11.2',
    d.series,
    d.aa,
    d.customer_name,
    d.customer_email,
    d.product || d.description,
    d.quantity,
    d.unit_price ?? d.amount,
    (d.doc_type === '11.4' ? -1 : 1) * Number(d.amount),
    PAY[d.payment_type] || d.payment_type,
    d.status,
    d.mark,
    d.correlated_mark,
  ].map(cell).join(';'))
  const csv = '﻿' + [head.map(cell).join(';'), ...rows].join('\r\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mydata-${c.env}-${p.get('from') || 'all'}-${p.get('to') || ''}.csv"`,
    },
  })
}
