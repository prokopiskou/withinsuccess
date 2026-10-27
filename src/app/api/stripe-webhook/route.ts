import { NextRequest, NextResponse } from 'next/server'
import { firstNameVocative } from '@/lib/nameFixer'
import type Stripe from 'stripe'
import crypto from 'crypto'
import { supabaseAdmin, setManyChatField } from '@/lib/manychat-utils'
import { getStripeClient } from '@/lib/stripeClient'
import { sendTikTokEvent } from '@/lib/tiktokEvents'
import { SEMINAR } from '@/lib/seminar'
import { Resend } from 'resend'

// Oxygen + PDF + email μπορεί να πάρουν μερικά δευτερόλεπτα
export const maxDuration = 60

const stripe = getStripeClient()

const META_PIXEL_ID = '1653590555890252'

// ============================================================
// PRODUCT CONFIGURATION — Routing based on amount/metadata
// ============================================================
type ProductConfig = {
  name: string
  mailerLiteGroup: string
  syncManyChat: boolean
  manyChatField?: number
}

// Stripe Product IDs (stable — don't change with price)
const PRODUCT_ID_63DAYS = 'prod_UKYraSNGQgor0D'
const PRODUCT_ID_30DAYS = 'prod_Rxeqpm5IWwBxef'

const CONFIG_63DAYS: ProductConfig = {
  name: '63 Μέρες Ζωής',
  mailerLiteGroup: '170438323755550313',
  syncManyChat: true,
  manyChatField: 14490102,
}

const CONFIG_30DAYS: ProductConfig = {
  name: '30 Μέρες',
  mailerLiteGroup: '148420836003415194',
  syncManyChat: false,
}

// Ανοιχτή Συζήτηση 15/11 — τα group IDs μπαίνουν ως env vars στο Vercel
const CONFIG_SEMINAR_LIVE: ProductConfig = {
  name: 'Ανοιχτή Συζήτηση · Δια ζώσης',
  mailerLiteGroup: process.env.MAILERLITE_GROUP_SEMINAR_LIVE || '201385793674020414',
  syncManyChat: false,
}

const CONFIG_SEMINAR_ONLINE: ProductConfig = {
  name: 'Ανοιχτή Συζήτηση · Online',
  mailerLiteGroup: process.env.MAILERLITE_GROUP_SEMINAR_ONLINE || '201385806670071499',
  syncManyChat: false,
}

function isSeminarConfig(p: ProductConfig): boolean {
  return p === CONFIG_SEMINAR_LIVE || p === CONFIG_SEMINAR_ONLINE
}

async function getProductConfig(
  session: Stripe.Checkout.Session,
  amount: number,
  metadata?: Record<string, string>
): Promise<ProductConfig> {
  // PRIORITY 1: Stripe Product ID via line items (most reliable, price-independent)
  try {
    const sessionFull = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items.data.price'],
    })
    const lineItems = sessionFull.line_items?.data || []
    
    for (const item of lineItems) {
      const productId = typeof item.price?.product === 'string'
        ? item.price.product
        : (item.price?.product as Stripe.Product | undefined)?.id || ''
      
      if (productId === PRODUCT_ID_63DAYS) {
        console.log(`[PRODUCT] ✅ Matched 63 Μέρες Ζωής via Product ID ${productId}`)
        return CONFIG_63DAYS
      }
      if (productId === PRODUCT_ID_30DAYS) {
        console.log(`[PRODUCT] ✅ Matched 30 Μέρες via Product ID ${productId}`)
        return CONFIG_30DAYS
      }
    }
    console.warn(`[PRODUCT] No matching Product ID in line items. Found:`, 
      lineItems.map(i => typeof i.price?.product === 'string' ? i.price.product : (i.price?.product as Stripe.Product | undefined)?.id))
  } catch (err) {
    console.warn('Failed to fetch line items for product detection:', err)
  }
  
  // PRIORITY 2: metadata.product (set by our /api/stripe/create-session)
  const product = (metadata?.product || '').toLowerCase().trim()
  if (product === '63days') {
    console.log(`[PRODUCT] Matched 63 Μέρες via metadata.product`)
    return CONFIG_63DAYS
  }
  if (product === '30days') {
    console.log(`[PRODUCT] Matched 30 Μέρες via metadata.product`)
    return CONFIG_30DAYS
  }
  if (product === 'seminar_live') {
    console.log(`[PRODUCT] Matched Σεμινάριο Live via metadata.product`)
    return CONFIG_SEMINAR_LIVE
  }
  if (product === 'seminar_online') {
    console.log(`[PRODUCT] Matched Σεμινάριο Online via metadata.product`)
    return CONFIG_SEMINAR_ONLINE
  }

  // ΚΑΜΙΑ ασαφής αντιστοίχιση (π.χ. product_name που περιέχει «30»/«63»).
  // Μόνο ρητό Product ID (P1) ή metadata.product (P2) βάζει κάποιον σε ομάδα,
  // ώστε να ΜΗΝ μπαίνει γενικός κόσμος στη λίστα από random session.completed.

  // No amount-based routing. Coaching / payment-link purchases must NOT be
  // grouped as a program. If the product is not clearly 63/30 days, we return
  // an empty group so the buyer is NOT added to any MailerLite list.
  console.warn(`[PRODUCT] ⚠️ UNKNOWN product (amount: ${amount}, metadata:`, metadata, ') — NOT adding to any MailerLite group')
  return {
    name: metadata?.product_name || 'WithinSuccess',
    mailerLiteGroup: '',
    syncManyChat: false,
  }
}

// ============================================================
// NAME FIXER — κλητική με κανόνες (src/lib/greekName.ts).
// Το AI κάνει μόνο καθαρισμό (τόνοι/κεφαλαία/greeklish), όχι γραμματική.
// "ΑΛΕΞΑΝΔΡΟΣ ΝΙΚΟΛΑΟΥ" → "Αλέξανδρε", "ΘΩΜΑΗ" → "Θωμαή"
// ============================================================
async function fixName(rawName: string): Promise<string> {
  if (!rawName || !rawName.trim()) return ''
  try {
    return await firstNameVocative(rawName)
  } catch (err) {
    console.error('fixName failed:', err)
    return rawName.trim().split(/\s+/)[0]
  }
}

// ============================================================
// META CONVERSIONS API
// ============================================================
// SHA-256 hash μιας κανονικοποιημένης τιμής (πεζά, χωρίς κενά άκρων).
function hashPII(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

async function sendMetaPurchaseEvent(params: {
  email: string | null | undefined
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  amount: number
  productName: string
  eventSourceUrl?: string
  eventId?: string
  fbp?: string | null
  fbc?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
}) {
  if (!process.env.META_CAPI_ACCESS_TOKEN) {
    console.log('Meta CAPI token missing, skipping server-side event')
    return
  }

  // em/ph/fn/ln/ct/st/zp/country/external_id → hashed arrays
  // fbp/fbc/client_ip_address/client_user_agent → plain (χωρίς hash)
  const userData: Record<string, string[] | string> = {}

  if (params.email) {
    userData.em = [hashPII(params.email)]
    userData.external_id = [hashPII(params.email)]
  }
  if (params.phone) {
    const cleanPhone = params.phone.replace(/[^\d]/g, '')
    if (cleanPhone) userData.ph = [crypto.createHash('sha256').update(cleanPhone).digest('hex')]
  }
  if (params.firstName) userData.fn = [hashPII(params.firstName)]
  if (params.lastName) userData.ln = [hashPII(params.lastName)]
  if (params.city) userData.ct = [hashPII(params.city.replace(/\s+/g, ''))]
  if (params.state) userData.st = [hashPII(params.state.replace(/\s+/g, ''))]
  if (params.zip) userData.zp = [hashPII(params.zip.replace(/\s+/g, ''))]
  if (params.country) userData.country = [hashPII(params.country)]

  if (params.fbp) userData.fbp = params.fbp
  if (params.fbc) userData.fbc = params.fbc
  if (params.clientIpAddress) userData.client_ip_address = params.clientIpAddress
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: process.env.META_CAPI_ACCESS_TOKEN,
          data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: params.eventId,
            action_source: 'website',
            event_source_url: params.eventSourceUrl || 'https://withinsuccess.gr',
            user_data: userData,
            custom_data: {
              currency: 'EUR',
              value: params.amount,
              content_name: params.productName,
              content_type: 'product'
            }
          }]
        })
      }
    )
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`Meta CAPI error (${res.status}):`, errorText)
    } else {
      console.log(`Meta Purchase event sent: €${params.amount} (${params.productName})`)
    }
  } catch (err) {
    console.error('Meta CAPI fetch failed:', err)
  }
}

// ============================================================
// OXYGEN INVOICING
// ============================================================
// Κατεβάζει το PDF της ΑΠΥ (μέχρι 3 προσπάθειες, γιατί μπορεί να αργεί λίγο μετά την έκδοση)
async function fetchOxygenPdf(baseUrl: string, key: string, invoiceId: string): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(`${baseUrl}/invoices/${invoiceId}/pdf?template=a4`, {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/pdf' },
      })
      const type = r.headers.get('content-type') || ''
      if (r.ok && type.includes('pdf')) return Buffer.from(await r.arrayBuffer())
      console.warn(`[Oxygen] PDF attempt ${attempt} (${r.status}, ${type})`)
    } catch (err) {
      console.warn(`[Oxygen] PDF attempt ${attempt} error:`, err)
    }
    await new Promise(res => setTimeout(res, 2000))
  }
  return null
}

// Στέλνει την απόδειξη στον πελάτη από το hello@withinsuccess.gr (Resend)
async function sendReceiptEmail(p: { to: string; number: string; pdf: Buffer | null; viewUrl: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Receipt] RESEND_API_KEY λείπει — δεν στάλθηκε απόδειξη')
    return
  }
  if (!p.pdf && !p.viewUrl) {
    console.error(`[Receipt] Ούτε PDF ούτε link για ${p.to} — δεν στάλθηκε απόδειξη`)
    return
  }
  const where = p.pdf
    ? 'Στο συνημμένο θα βρεις την απόδειξή σου.'
    : `Την απόδειξή σου τη βρίσκεις εδώ: <a href="${p.viewUrl}" style="color:#8A6D2F;">προβολή απόδειξης</a>`
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'Προκόπης από WithinSuccess <hello@withinsuccess.gr>',
      to: p.to,
      replyTo: 'hello@withinsuccess.gr',
      subject: 'Η απόδειξή σου · WithinSuccess',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0D0D0D; font-size: 16px; line-height: 1.7;">
          <p>Σε ευχαριστώ για την εμπιστοσύνη σου.</p>
          <p>${where}</p>
          ${p.number ? `<p style="color:#6B6B6B; font-size:14px;">Απόδειξη Παροχής Υπηρεσιών ${p.number}</p>` : ''}
          <p>Για οποιαδήποτε απορία, απάντησε σε αυτό το email.</p>
          <p>Προκόπης</p>
        </div>
      `,
      ...(p.pdf
        ? { attachments: [{ filename: `apodeiksi-withinsuccess${p.number ? '-' + p.number.replace(/\s+/g, '-') : ''}.pdf`, content: p.pdf }] }
        : {}),
    })
    if (error) console.error('[Receipt] Resend error:', error)
    else console.log(`[Receipt] Στάλθηκε στο ${p.to}${p.pdf ? ' με PDF' : ' με link'}`)
  } catch (err) {
    console.error('[Receipt] Unexpected error:', err)
  }
}

async function createOxygenInvoice(customerName: string, customerEmail: string, amount: number, productName: string, quantity = 1, paidWithPaypal = false) {
  const OXYGEN_API_KEY = process.env.OXYGEN_API_KEY
  if (!OXYGEN_API_KEY) {
    console.warn('[Oxygen] OXYGEN_API_KEY λείπει — δεν εκδόθηκε παραστατικό')
    return
  }
  // Δεν αφήνουμε ποτέ το Oxygen να ρίξει το webhook (MailerLite/Meta έχουν ήδη γίνει)
  try {
    const baseUrl = 'https://api.oxygen.gr/v1'
    const headers = {
      'Authorization': `Bearer ${OXYGEN_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const contactRes = await fetch(`${baseUrl}/contacts`, {
      method: 'POST',
      headers,
      // Ιδιώτης πελάτης: type 1, με όνομα και επώνυμο (υποχρεωτικά για type 1)
      body: JSON.stringify((() => {
        const parts = customerName.trim().split(/\s+/).filter(Boolean)
        return {
          type: 1,
          is_client: true,
          is_supplier: false,
          country: 'GR',
          name: parts[0] || 'Πελάτης',
          surname: parts.slice(1).join(' ') || '-',
          ...(customerEmail ? { email: customerEmail } : {}),
        }
      })()),
    })
    const contact = await contactRes.json().catch(() => null)
    const contactId = contact?.data?.id || contact?.id
    if (!contactRes.ok || !contactId) {
      console.error(`[Oxygen] Contact failed (${contactRes.status}):`, JSON.stringify(contact).slice(0, 800))
      return
    }

    // ΑΠΥ (Απόδειξη Παροχής Υπηρεσιών) σε ιδιώτη, εξοφλημένη, με διαβίβαση στο myDATA.
    // Τα IDs του λογαριασμού μπαίνουν ως env vars στο Vercel (δες /api/dashboard/oxygen-setup).
    // IDs του λογαριασμού Oxygen (από /api/dashboard/oxygen-setup). Δεν είναι μυστικά.
    const paymentMethodId = paidWithPaypal
      ? '0eeec0c3-c9a9-4623-9d34-bc844ad55781' // PayPal
      : '9b38257d-a4fa-4e12-9923-aa440bdbe93e' // Κάρτα μέσω POS / e-POS
    const taxId = process.env.OXYGEN_TAX_ID || '331db5c0-d118-11f0-8710-fa163eb3df25' // 0% · άνευ ΦΠΑ (εξαίρεση 7)
    const sequenceId = process.env.OXYGEN_SEQUENCE_ID_APY || '33212260-d118-11f0-8710-fa163eb3df25' // ΑΠΥ σειρά TAM

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Athens' }) // YYYY-MM-DD
    const total = Math.round(amount) / 100
    const unit = Math.round((total / quantity) * 100) / 100
    const invoiceRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contact_id: contactId,
        document_type: 'rs',
        mydata_document_type: '11.2',
        issue_date: today,
        language: 'gr',
        payment_method_id: paymentMethodId,
        ...(sequenceId ? { numbering_sequence_id: sequenceId } : {}),
        is_paid: true,
        items: [
          {
            description: productName,
            quantity,
            unit_net_value: unit,
            net_amount_pre_discount: total,
            net_amount: total,
            vat_amount: 0,
            tax_id: taxId,
            mydata_classification_category: 'category1_3',
            mydata_classification_type: 'E3_561_003',
          }
        ],
      }),
    })
    const invoice = await invoiceRes.json().catch(() => null)
    if (!invoiceRes.ok) {
      console.error(`[Oxygen] ΑΠΥ failed (${invoiceRes.status}):`, JSON.stringify(invoice).slice(0, 1200))
      return
    }
    const inv = invoice?.data || invoice
    console.log(`[Oxygen] ΑΠΥ ${inv?.number ?? ''} created (${inv?.id}) · myDATA mark: ${inv?.mydata?.mark ?? 'pending'}`)

    if (customerEmail && inv?.id) {
      await sendReceiptEmail({
        to: customerEmail,
        number: inv?.number ? `${inv?.numbering_sequence ?? ''} ${inv.number}`.trim() : '',
        pdf: await fetchOxygenPdf(baseUrl, OXYGEN_API_KEY, inv.id),
        viewUrl: inv?.iview_url || '',
      })
    }
  } catch (err) {
    console.error('[Oxygen] Unexpected error:', err)
  }
}

// ============================================================
// MAILERLITE
// ============================================================
async function addToMailerLite(email: string, firstName: string, lastName: string, groupId: string) {
  if (!groupId) {
    console.log(`[MailerLite] No group for this product — skipping ${email}`)
    return
  }
  try {
    const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        fields: {
          name: firstName,
          last_name: lastName
        },
        groups: [groupId],
        status: 'active'
      })
    })
    
    if (!mlRes.ok) {
      console.error(`MailerLite error (${mlRes.status}):`, await mlRes.text())
    } else {
      console.log(`MailerLite: ${email} (${firstName}) added to group ${groupId}`)
    }
  } catch (err) {
    console.error('MailerLite fetch failed:', err)
  }
}

// ============================================================
// MAIN WEBHOOK HANDLER
// ============================================================
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe signature failed:', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  // ===================================================================
  // CHECKOUT COMPLETED — Successful payment
  // ===================================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const subscriberId = session.metadata?.subscriber_id
    const email = session.customer_email || session.customer_details?.email || null
    const phone = session.customer_details?.phone || null
    const amount = (session.amount_total || 0) / 100
    const rawFullName = session.customer_details?.name || ''
    const nameBits = rawFullName.trim().split(/\s+/).filter(Boolean)
    const capiFirstName = nameBits[0] || ''
    const capiLastName = nameBits.slice(1).join(' ')
    const addr = session.customer_details?.address
    const meta = (session.metadata || {}) as Record<string, string>

    // Determine which product was purchased
    const product = await getProductConfig(session, amount, session.metadata as Record<string, string>)
    console.log(`Purchase: €${amount} → ${product.name} (group ${product.mailerLiteGroup})`)

    // Οι αγορές του Within Path (metadata.program) στέλνονται στο Meta/TikTok από το δικό του webhook.
    // Αν τις στέλναμε κι εδώ, κάθε αγορά θα μετρούσε διπλά στο pixel.
    const ownedByWithinPath = Boolean(meta.program)

    // 1. Send Purchase event to Meta CAPI (πλήρες user_data για υψηλό Event Match Quality)
    if (!ownedByWithinPath) await sendMetaPurchaseEvent({
      email,
      phone,
      firstName: capiFirstName,
      lastName: capiLastName,
      city: addr?.city,
      state: addr?.state,
      zip: addr?.postal_code,
      country: addr?.country,
      amount,
      productName: product.name,
      eventId: session.id,
      fbp: meta.fbp || null,
      fbc: meta.fbc || null,
      clientIpAddress: meta.client_ip_address || null,
      clientUserAgent: meta.client_user_agent || null,
      eventSourceUrl: isSeminarConfig(product)
        ? 'https://withinsuccess.gr/anoixti-syzitisi'
        : amount === 15
          ? 'https://withinsuccess.gr/30days'
          : 'https://withinsuccess.gr/63days'
    })

    // 1b. TikTok Events API — Purchase (event_id = session.id, ίδιο με το browser)
    const isThirtyDays = product.name === '30 Μέρες'
    if (!ownedByWithinPath) await sendTikTokEvent({
      event: 'Purchase',
      eventId: session.id,
      value: amount,
      contentId: isThirtyDays
        ? '30days-program'
        : product.name === '63 Μέρες Ζωής'
          ? '63days-program'
          : isSeminarConfig(product) ? (meta.product || 'seminar') : 'other',
      contentName: product.name,
      pageUrl: isSeminarConfig(product)
        ? 'https://withinsuccess.gr/anoixti-syzitisi'
        : isThirtyDays ? 'https://withinsuccess.gr/30days' : 'https://withinsuccess.gr/63days',
      email,
      phone,
      ttclid: meta.ttclid || null,
      ttp: meta.ttp || null,
      ip: meta.client_ip_address || null,
      userAgent: meta.client_user_agent || null,
    })

    // 2. Update Supabase + ManyChat (only for products that use ManyChat)
    if (subscriberId && product.syncManyChat) {
      await supabaseAdmin
        .from('manychat_conversations')
        .update({
          payment_completed_at: new Date().toISOString(),
          status: 'paid'
        })
        .eq('subscriber_id', subscriberId)
      
      if (product.manyChatField) {
        await setManyChatField(subscriberId, product.manyChatField, 'yes')
      }
    }

    // 3. Fix name to vocative case + add to MailerLite (correct group)
    if (email) {
      const fixedFirstName = await fixName(rawFullName)
      const nameParts = rawFullName.trim().split(/\s+/)
      const lastName = nameParts.slice(1).join(' ') || ''
      
      await addToMailerLite(email, fixedFirstName, lastName, product.mailerLiteGroup)
    }

    // 4. Create Oxygen invoice (use raw full name for legal/tax purposes)
    const customerEmail = session.customer_email || session.customer_details?.email || ''
    let paidWithPaypal = false
    try {
      const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
      if (piId) {
        const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] })
        const charge = pi.latest_charge as Stripe.Charge | null
        paidWithPaypal = charge?.payment_method_details?.type === 'paypal'
      }
    } catch (err) {
      console.warn('[Oxygen] Δεν βρέθηκε τρόπος πληρωμής, χρησιμοποιείται κάρτα:', err)
    }
    await createOxygenInvoice(
      rawFullName.trim(),
      customerEmail,
      session.amount_total || 0,
      session.metadata?.product_name || product.name,
      // Εισιτήρια Συζήτησης: η ποσότητα βγαίνει από το ποσό (15€ το εισιτήριο)
      isSeminarConfig(product)
        ? Math.max(1, Math.round((session.amount_total || 0) / (SEMINAR.priceEur * 100)))
        : 1,
      paidWithPaypal
    )

    return NextResponse.json({ 
      received: true, 
      processed: 'purchase',
      product: product.name 
    })
  }

  // ===================================================================
  // CHECKOUT EXPIRED — Abandoned cart
  // ===================================================================
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const subscriberId = session.metadata?.subscriber_id
    const email = session.customer_email || session.customer_details?.email

    if (subscriberId) {
      await supabaseAdmin
        .from('manychat_conversations')
        .update({
          status: 'checkout_abandoned'
        })
        .eq('subscriber_id', subscriberId)
    }

    console.log(`Checkout expired: ${subscriberId || 'unknown'} (email: ${email || 'none'})`)
    return NextResponse.json({ received: true, processed: 'expired' })
  }

  return NextResponse.json({ received: true })
}