import { supabaseAdmin } from '@/lib/manychat-utils'

/**
 * myDATA (ΑΑΔΕ) — απευθείας διαβίβαση αποδείξεων από το site, χωρίς Oxygen.
 *
 * ΚΑΤΑΣΤΑΣΗ: μόνο σε δοκιμαστικό περιβάλλον. ΔΕΝ είναι συνδεδεμένο με το Stripe webhook.
 * Ενεργοποίηση μόνο αφού το εγκρίνει ο λογιστής (βλ. MYDATA_SETUP.md).
 *
 * Env (μόνο στο Vercel):
 *   MYDATA_ENV=dev | prod        (default: dev)
 *   MYDATA_USER, MYDATA_KEY      (χρήστης + subscription key από το αντίστοιχο περιβάλλον)
 *   MYDATA_VAT                   (ΑΦΜ εκδότη, default 154067080)
 *   MYDATA_SERIES / MYDATA_CREDIT_SERIES  (default WEB / WEBC)
 *   MYDATA_VAT_EXEMPTION         (κατηγορία εξαίρεσης ΦΠΑ, default 7 = άρθρο 22 – ΝΑ ΤΟ ΕΠΙΒΕΒΑΙΩΣΕΙ Ο ΛΟΓΙΣΤΗΣ)
 */

export type MyDataEnv = 'dev' | 'prod'

const ENDPOINTS: Record<MyDataEnv, string> = {
  dev: 'https://mydataapidev.aade.gr',
  prod: 'https://mydatapi.aade.gr/myDATA',
}

export function mydataConfig() {
  const env = (process.env.MYDATA_ENV === 'prod' ? 'prod' : 'dev') as MyDataEnv
  return {
    env,
    base: ENDPOINTS[env],
    user: process.env.MYDATA_USER || '',
    key: process.env.MYDATA_KEY || '',
    vat: process.env.MYDATA_VAT || '154067080',
    series: process.env.MYDATA_SERIES || 'WEB',
    creditSeries: process.env.MYDATA_CREDIT_SERIES || 'WEBC',
    vatExemption: process.env.MYDATA_VAT_EXEMPTION || '7',
    configured: !!(process.env.MYDATA_USER && process.env.MYDATA_KEY),
    // Πραγματική έκδοση από το ταμείο του dashboard μόνο αν ανοίξει ρητά (μετά την έγκριση του λογιστή)
    live: process.env.MYDATA_LIVE === '1',
  }
}

/** Επιτρέπεται έκδοση από το dashboard; Σε dev πάντα, σε παραγωγή μόνο με MYDATA_LIVE=1 */
export function canIssueFromDashboard() {
  const c = mydataConfig()
  return c.env === 'dev' || c.live
}

/** Τρόποι πληρωμής myDATA */
export const PAYMENT = {
  bank: 1,
  cash: 3,
  webBanking: 6,
  card: 7, // POS / e-POS
  iris: 8,
} as const

export type ReceiptInput = {
  amount: number // € με ΦΠΑ (εδώ απαλλαγή, άρα καθαρό = μικτό)
  paymentType: number
  description?: string
  customerEmail?: string | null
  externalRef?: string | null // π.χ. Stripe payment intent / invoice id
  issueDate?: Date
  correlatedMark?: string | null // μόνο για πιστωτικό 11.4
  customerName?: string | null
  product?: string | null
  quantity?: number
  unitPrice?: number
  source?: 'manual' | 'stripe' | 'viva'
}

export type MyDataDoc = {
  id: string
  env: MyDataEnv
  doc_type: string
  series: string
  aa: number
  issue_date: string
  amount: number
  payment_type: number
  description: string | null
  customer_email: string | null
  external_ref: string | null
  mark: string | null
  uid: string | null
  qr_url: string | null
  correlated_mark: string | null
  customer_name: string | null
  product: string | null
  quantity: number
  unit_price: number | null
  source: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  error: string | null
  created_at: string
}

// ---------- XML ----------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2)
const day = (d: Date) => {
  // ημερομηνία Ελλάδας, YYYY-MM-DD
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  return parts
}

export function buildInvoiceXml(p: {
  vat: string
  series: string
  aa: number
  type: '11.2' | '11.4'
  issueDate: Date
  amount: number
  paymentType: number
  vatExemption: string
  correlatedMark?: string | null
}) {
  const amt = money(p.amount)
  const cls = `<icls:classificationType>E3_561_003</icls:classificationType><icls:classificationCategory>category1_3</icls:classificationCategory><icls:amount>${amt}</icls:amount>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0" xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0" xmlns:ecls="https://www.aade.gr/myDATA/expensesClassificaton/v1.0">
  <invoice>
    <issuer>
      <vatNumber>${esc(p.vat)}</vatNumber>
      <country>GR</country>
      <branch>0</branch>
    </issuer>
    <invoiceHeader>
      <series>${esc(p.series)}</series>
      <aa>${p.aa}</aa>
      <issueDate>${day(p.issueDate)}</issueDate>
      <invoiceType>${p.type}</invoiceType>
      <currency>EUR</currency>${p.correlatedMark ? `
      <correlatedInvoices>${esc(p.correlatedMark)}</correlatedInvoices>` : ''}
    </invoiceHeader>
    <paymentMethods>
      <paymentMethodDetails>
        <type>${p.paymentType}</type>
        <amount>${amt}</amount>
      </paymentMethodDetails>
    </paymentMethods>
    <invoiceDetails>
      <lineNumber>1</lineNumber>
      <netValue>${amt}</netValue>
      <vatCategory>7</vatCategory>
      <vatAmount>0.00</vatAmount>
      <vatExemptionCategory>${esc(p.vatExemption)}</vatExemptionCategory>
      <incomeClassification>${cls}</incomeClassification>
    </invoiceDetails>
    <invoiceSummary>
      <totalNetValue>${amt}</totalNetValue>
      <totalVatAmount>0.00</totalVatAmount>
      <totalWithheldAmount>0.00</totalWithheldAmount>
      <totalFeesAmount>0.00</totalFeesAmount>
      <totalStampDutyAmount>0.00</totalStampDutyAmount>
      <totalOtherTaxesAmount>0.00</totalOtherTaxesAmount>
      <totalDeductionsAmount>0.00</totalDeductionsAmount>
      <totalGrossValue>${amt}</totalGrossValue>
      <incomeClassification>${cls}</incomeClassification>
    </invoiceSummary>
  </invoice>
</InvoicesDoc>`
}

const tag = (xml: string, name: string) => {
  const m = new RegExp(`<(?:\\w+:)?${name}>([\\s\\S]*?)</(?:\\w+:)?${name}>`).exec(xml)
  return m ? m[1].trim() : null
}

export function parseResponse(xml: string) {
  const status = tag(xml, 'statusCode')
  const errors = [...xml.matchAll(/<message>([\s\S]*?)<\/message>[\s\S]*?<code>([\s\S]*?)<\/code>/g)].map(m => `${m[2]}: ${m[1]}`)
  return {
    ok: status === 'Success',
    status,
    mark: tag(xml, 'invoiceMark'),
    uid: tag(xml, 'invoiceUid'),
    qrUrl: tag(xml, 'qrUrl') || tag(xml, 'qrCodeUrl'),
    cancellationMark: tag(xml, 'cancellationMark'),
    errors,
  }
}

// ---------- αρίθμηση ----------

async function nextAa(env: MyDataEnv, series: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('mydata_next_aa', { p_env: env, p_series: series })
  if (error) throw new Error(`Αρίθμηση: ${error.message}`)
  return data as number
}

// ---------- αποστολή ----------

async function post(path: string, body?: string) {
  const c = mydataConfig()
  if (!c.configured) throw new Error('Λείπουν MYDATA_USER / MYDATA_KEY')
  const res = await fetch(`${c.base}${path}`, {
    method: 'POST',
    headers: { 'aade-user-id': c.user, 'Ocp-Apim-Subscription-Key': c.key, 'Content-Type': 'application/xml' },
    body,
  })
  const text = await res.text()
  return { httpOk: res.ok, status: res.status, text }
}

/** Εκδίδει ΑΠΥ 11.2 (ή πιστωτικό 11.4 αν δοθεί correlatedMark) και τη διαβιβάζει. */
export async function issueReceipt(input: ReceiptInput): Promise<MyDataDoc> {
  const c = mydataConfig()
  const isCredit = !!input.correlatedMark
  const type = isCredit ? '11.4' : '11.2'
  const series = isCredit ? c.creditSeries : c.series
  const aa = await nextAa(c.env, series)
  const issueDate = input.issueDate || new Date()

  const { data: row, error } = await supabaseAdmin
    .from('mydata_docs')
    .insert({
      env: c.env,
      doc_type: type,
      series,
      aa,
      issue_date: day(issueDate),
      amount: input.amount,
      payment_type: input.paymentType,
      description: input.description || null,
      customer_email: input.customerEmail || null,
      external_ref: input.externalRef || null,
      correlated_mark: input.correlatedMark || null,
      customer_name: input.customerName || null,
      product: input.product || null,
      quantity: input.quantity || 1,
      unit_price: input.unitPrice ?? null,
      source: input.source || 'manual',
      status: 'pending',
    })
    .select('*')
    .single()
  if (error) throw new Error(`Βάση: ${error.message}`)

  const xml = buildInvoiceXml({
    vat: c.vat,
    series,
    aa,
    type,
    issueDate,
    amount: input.amount,
    paymentType: input.paymentType,
    vatExemption: c.vatExemption,
    correlatedMark: input.correlatedMark,
  })

  let patch: Partial<MyDataDoc>
  try {
    const r = await post('/SendInvoices', xml)
    const parsed = parseResponse(r.text)
    patch = parsed.ok
      ? { status: 'sent', mark: parsed.mark, uid: parsed.uid, qr_url: parsed.qrUrl, error: null }
      : { status: 'failed', error: (parsed.errors.join(' | ') || `${r.status} ${r.text}`).slice(0, 1000) }
  } catch (e) {
    patch = { status: 'failed', error: (e as Error).message.slice(0, 1000) }
  }

  const { data: updated } = await supabaseAdmin.from('mydata_docs').update(patch).eq('id', row.id).select('*').single()
  return (updated || { ...row, ...patch }) as MyDataDoc
}

/** Ξαναστέλνει ένα αποτυχημένο παραστατικό με τον ΙΔΙΟ αριθμό (ώστε να μη μένουν κενά στη σειρά). */
export async function retryDoc(id: string): Promise<MyDataDoc> {
  const c = mydataConfig()
  const { data: doc } = await supabaseAdmin.from('mydata_docs').select('*').eq('id', id).single()
  if (!doc) throw new Error('Δεν βρέθηκε')
  if (doc.status === 'sent') return doc as MyDataDoc
  if (doc.env !== c.env) throw new Error('Το παραστατικό ανήκει σε άλλο περιβάλλον')
  const xml = buildInvoiceXml({
    vat: c.vat,
    series: doc.series,
    aa: doc.aa,
    type: doc.doc_type as '11.2' | '11.4',
    issueDate: new Date(`${doc.issue_date}T12:00:00+02:00`),
    amount: Number(doc.amount),
    paymentType: doc.payment_type,
    vatExemption: c.vatExemption,
    correlatedMark: doc.correlated_mark,
  })
  const r = await post('/SendInvoices', xml)
  const parsed = parseResponse(r.text)
  const patch = parsed.ok
    ? { status: 'sent', mark: parsed.mark, uid: parsed.uid, qr_url: parsed.qrUrl, error: null }
    : { status: 'failed', error: (parsed.errors.join(' | ') || `${r.status} ${r.text}`).slice(0, 1000) }
  const { data: updated } = await supabaseAdmin.from('mydata_docs').update(patch).eq('id', id).select('*').single()
  return updated as MyDataDoc
}

/** Ακύρωση παραστατικού που στάλθηκε κατά λάθος (όχι για επιστροφές — εκεί πιστωτικό). */
export async function cancelDoc(mark: string) {
  const r = await post(`/CancelInvoice?mark=${encodeURIComponent(mark)}`)
  return parseResponse(r.text)
}
