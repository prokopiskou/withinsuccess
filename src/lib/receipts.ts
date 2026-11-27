import { supabaseAdmin } from '@/lib/manychat-utils'
import { issueReceipt, mydataConfig, PAYMENT, type MyDataDoc } from '@/lib/mydata'
import { sendReceiptEmail } from '@/lib/receiptEmail'

/**
 * Ποιος κόβει τις αποδείξεις των αγορών (Stripe webhook).
 *
 *   RECEIPTS_PROVIDER=oxygen  (default) → Oxygen, όπως πάντα
 *   RECEIPTS_PROVIDER=mydata            → απευθείας myDATA. Ισχύει ΜΟΝΟ αν MYDATA_ENV=prod + MYDATA_LIVE=1 + κλειδιά.
 *                                         Αλλιώς πέφτει αυτόματα σε Oxygen (ποτέ αγορά χωρίς απόδειξη).
 *   MYDATA_SHADOW=1                     → με Oxygen ενεργό, κόβει ΚΑΙ δοκιμαστική στο dev myDATA για σύγκριση (χωρίς email).
 *   MYDATA_PAYPAL_PAYMENT_TYPE          → κωδικός myDATA για PayPal (default 7 — να το επιβεβαιώσει ο λογιστής)
 */
export function receiptsProvider(): 'oxygen' | 'mydata' {
  if (process.env.RECEIPTS_PROVIDER !== 'mydata') return 'oxygen'
  const c = mydataConfig()
  if (c.env === 'prod' && c.live && c.configured) return 'mydata'
  console.error('[Receipts] RECEIPTS_PROVIDER=mydata αλλά το myDATA δεν είναι έτοιμο (MYDATA_ENV=prod, MYDATA_LIVE=1, κλειδιά) → Oxygen')
  return 'oxygen'
}

export function mydataShadow() {
  return process.env.MYDATA_SHADOW === '1' && mydataConfig().env === 'dev' && mydataConfig().configured
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://withinsuccess.gr').replace(/\/$/, '')
export const publicReceiptUrl = (token: string) => `${SITE}/apodeiksi/${token}`

type Doc = MyDataDoc & { public_token?: string; emailed_at?: string | null }

/** Email στον πελάτη με link στη δημόσια απόδειξη (μία φορά ανά παραστατικό). */
export async function emailReceipt(doc: Doc): Promise<boolean> {
  if (!doc.customer_email || doc.emailed_at || doc.status !== 'sent' || !doc.public_token) return false
  const ok = await sendReceiptEmail({
    to: doc.customer_email,
    number: `${doc.series} ${doc.aa}`,
    pdf: null,
    viewUrl: publicReceiptUrl(doc.public_token),
  })
  if (ok) await supabaseAdmin.from('mydata_docs').update({ emailed_at: new Date().toISOString() }).eq('id', doc.id)
  return ok
}

/**
 * ΑΠΥ για αγορά από Stripe. Idempotent: ίδιο externalRef → καμία δεύτερη απόδειξη.
 * Επιστρέφει true αν υπάρχει παραστατικό (ακόμα κι αν η διαβίβαση απέτυχε — τότε φαίνεται
 * στο Ταμείο ως «Απέτυχε» και ξαναστέλνεται με τον ίδιο αριθμό).
 */
export async function issueStripeReceipt(p: {
  customerName: string
  customerEmail: string
  amountCents: number
  product: string
  quantity?: number
  paypal?: boolean
  externalRef: string
  shadow?: boolean
}): Promise<boolean> {
  const c = mydataConfig()
  try {
    const { data: found } = await supabaseAdmin
      .from('mydata_docs')
      .select('*')
      .eq('env', c.env)
      .eq('doc_type', '11.2')
      .eq('external_ref', p.externalRef)
      .limit(1)
    let doc = found?.[0] as Doc | undefined
    if (!doc) {
      const total = Math.round(p.amountCents) / 100
      const quantity = Math.max(1, p.quantity || 1)
      doc = (await issueReceipt({
        amount: total,
        unitPrice: Math.round((total / quantity) * 100) / 100,
        quantity,
        paymentType: p.paypal ? Number(process.env.MYDATA_PAYPAL_PAYMENT_TYPE) || PAYMENT.card : PAYMENT.card,
        product: p.product,
        description: p.product,
        customerName: p.customerName || null,
        customerEmail: p.customerEmail || null,
        externalRef: p.externalRef,
        source: 'stripe',
        vatRate: 0,
      })) as Doc
    }
    const tag = p.shadow ? '[myDATA shadow]' : '[myDATA]'
    if (doc.status === 'sent') {
      console.log(`${tag} ΑΠΥ ${doc.series} ${doc.aa} · MARK ${doc.mark}`)
      if (!p.shadow) await emailReceipt(doc)
    } else {
      console.error(`${tag} ΑΠΥ ${doc.series} ${doc.aa} ΔΕΝ διαβιβάστηκε: ${doc.error} — ξαναστείλ' την από το Ταμείο`)
    }
    return true
  } catch (err) {
    console.error('[myDATA] Αποτυχία έκδοσης:', err)
    return false
  }
}
