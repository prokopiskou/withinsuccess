import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin, setManyChatField } from '@/lib/manychat-utils'
import { getStripeClient } from '@/lib/stripeClient'

const stripe = getStripeClient()

const META_PIXEL_ID = '1653590555890252'

const META_MAX = 500

function clipMeta(v: string): string {
  return v.length > META_MAX ? v.slice(0, META_MAX) : v
}

/**
 * Στέλνει InitiateCheckout event στο Meta server-side για deduplication.
 */
async function sendMetaInitiateCheckout(params: {
  email: string | null
  amount: number
  eventId: string
  fbp?: string
  fbc?: string
  sourceUrl?: string
}) {
  if (!process.env.META_CAPI_ACCESS_TOKEN) {
    return
  }

  const userData: Record<string, string | string[]> = {}
  
  if (params.email) {
    const hashedEmail = crypto
      .createHash('sha256')
      .update(params.email.toLowerCase().trim())
      .digest('hex')
    userData.em = [hashedEmail]
  }
  
  if (params.fbp) userData.fbp = params.fbp
  if (params.fbc) userData.fbc = params.fbc

  try {
    await fetch(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: process.env.META_CAPI_ACCESS_TOKEN,
          data: [{
            event_name: 'InitiateCheckout',
            event_time: Math.floor(Date.now() / 1000),
            event_id: params.eventId,
            action_source: 'website',
            event_source_url: params.sourceUrl || 'https://withinsuccess.gr/63days',
            user_data: userData,
            custom_data: {
              currency: 'EUR',
              value: params.amount,
              content_name: '63 Μέρες Ζωής',
              content_type: 'product'
            }
          }]
        })
      }
    )
  } catch (err) {
    console.error('Meta CAPI InitiateCheckout failed:', err)
  }
}

/**
 * Παίρνει το τρέχον price ID βάσει ημερομηνίας.
 * Αν δεν έχεις πολλαπλά price IDs, απλά επιστρέφει το βασικό.
 */
function getCurrentPriceId(): string {
  // Αν έχεις διαφορετικά Stripe Price IDs για 69€, 89€, 109€, 
  // βάλε τη logic εδώ. Αλλιώς, χρησιμοποιείται το βασικό.
  return process.env.STRIPE_PRICE_ID!
}

function getPriceIdForWebProduct(product: '63days' | '30days'): string {
  if (product === '63days') {
    const id = process.env.STRIPE_PRICE_ID
    if (!id) throw new Error('Missing STRIPE_PRICE_ID')
    return id
  }
  const id = process.env.STRIPE_PRICE_ID_30DAYS
  if (!id) throw new Error('Missing STRIPE_PRICE_ID_30DAYS')
  return id
}

function getCurrentAmount(): number {
  const now = new Date()
  const greece = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Athens' }))
  const month = greece.getMonth() + 1
  const day = greece.getDate()

  if (month === 4 && day <= 27) return 69
  if ((month === 4 && day > 27) || (month === 5 && day <= 4)) return 89
  return 109
}

type UTMInput = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  utm_captured_at?: string
  utm_landing_path?: string
}

function metaString(v: unknown): string {
  if (v === undefined || v === null) return ''
  return String(v)
}

function normalizeUTM(utm: unknown): {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  utm_captured_at: string
  utm_landing_path: string
} {
  const u = (utm && typeof utm === 'object' ? utm : {}) as UTMInput
  return {
    utm_source: metaString(u.utm_source),
    utm_medium: metaString(u.utm_medium),
    utm_campaign: metaString(u.utm_campaign),
    utm_content: metaString(u.utm_content),
    utm_term: metaString(u.utm_term),
    utm_captured_at: metaString(u.utm_captured_at),
    utm_landing_path: metaString(u.utm_landing_path),
  }
}

function webSessionMetadata(
  product: '63days' | '30days',
  utm: ReturnType<typeof normalizeUTM>
): Record<string, string> {
  return {
    product: clipMeta(product),
    utm_source: clipMeta(utm.utm_source),
    utm_medium: clipMeta(utm.utm_medium),
    utm_campaign: clipMeta(utm.utm_campaign),
    utm_content: clipMeta(utm.utm_content),
    utm_term: clipMeta(utm.utm_term),
    utm_captured_at: clipMeta(utm.utm_captured_at),
    utm_landing_path: clipMeta(utm.utm_landing_path),
  }
}

function webPaymentIntentMetadata(
  product: '63days' | '30days',
  utm: ReturnType<typeof normalizeUTM>
): Record<string, string> {
  return {
    product: clipMeta(product),
    utm_source: clipMeta(utm.utm_source),
    utm_medium: clipMeta(utm.utm_medium),
    utm_campaign: clipMeta(utm.utm_campaign),
    utm_content: clipMeta(utm.utm_content),
    utm_term: clipMeta(utm.utm_term),
  }
}

function isWebProduct(p: unknown): p is '63days' | '30days' {
  return p === '63days' || p === '30days'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscriber_id, fbp, fbc, utm: utmBody, product: productRaw } = body
    const utm = normalizeUTM(utmBody)
    const site = process.env.NEXT_PUBLIC_SITE_URL || ''

    // Web checkout (UTM + product) — from startCheckout() / site CTAs
    if (isWebProduct(productRaw)) {
      const product = productRaw
      const priceId = getPriceIdForWebProduct(product)
      const successPath =
        product === '63days' ? '/63days/thank-you' : '/30days/thank-you'
      const cancelPath = product === '63days' ? '/63days' : '/30days'

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: webSessionMetadata(product, utm),
        payment_intent_data: {
          metadata: webPaymentIntentMetadata(product, utm),
        },
        success_url: `${site}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}${cancelPath}`,
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      })

      return NextResponse.json({ url: session.url })
    }

    // ManyChat agent checkout (subscriber_id required)
    if (!subscriber_id) {
      return NextResponse.json(
        { error: 'missing subscriber_id or invalid product' },
        { status: 400 }
      )
    }

    const manychatProduct = '63days' as const

    // Πάρε το email αν υπάρχει ήδη στο Supabase (για pre-fill στο Stripe)
    const { data: conversation } = await supabaseAdmin
      .from('manychat_conversations')
      .select('email')
      .eq('subscriber_id', subscriber_id)
      .single()

    const existingEmail = conversation?.email || null

    // Δημιουργία Stripe session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: getCurrentPriceId(),
        quantity: 1
      }],
      customer_email: existingEmail || undefined, // Pre-fill αν έχουμε
      metadata: {
        subscriber_id: clipMeta(String(subscriber_id)),
        source: 'manychat_agent',
        product: manychatProduct,
        fbp: clipMeta(fbp || ''),
        fbc: clipMeta(fbc || ''),
        utm_source: clipMeta(utm.utm_source),
        utm_medium: clipMeta(utm.utm_medium),
        utm_campaign: clipMeta(utm.utm_campaign),
        utm_content: clipMeta(utm.utm_content),
        utm_term: clipMeta(utm.utm_term),
        utm_captured_at: clipMeta(utm.utm_captured_at),
        utm_landing_path: clipMeta(utm.utm_landing_path),
      },
      payment_intent_data: {
        metadata: {
          product: manychatProduct,
          utm_source: clipMeta(utm.utm_source),
          utm_medium: clipMeta(utm.utm_medium),
          utm_campaign: clipMeta(utm.utm_campaign),
          utm_content: clipMeta(utm.utm_content),
          utm_term: clipMeta(utm.utm_term),
        },
      },
      success_url: `${site}/63days/thank-you?sid=${subscriber_id}`,
      cancel_url: `${site}/63days?sid=${subscriber_id}`,
      expires_at: Math.floor(Date.now() / 1000) + 1800 // 30 λεπτά
    })

    // Update Supabase (1 query αντί για 2)
    await supabaseAdmin
      .from('manychat_conversations')
      .update({
        stripe_session_id: session.id,
        checkout_started_at: new Date().toISOString(),
        status: 'checkout_started'
      })
      .eq('subscriber_id', subscriber_id)

    // Update ManyChat custom field
    await setManyChatField(subscriber_id, 14490101, 'yes')

    // Στείλε InitiateCheckout στο Meta server-side
    // (για deduplication με client-side fbq('track', 'InitiateCheckout'))
    await sendMetaInitiateCheckout({
      email: existingEmail,
      amount: getCurrentAmount(),
      eventId: session.id,
      fbp,
      fbc,
      sourceUrl: 'https://withinsuccess.gr/63days'
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Stripe session error:', err)
    const message = err instanceof Error ? err.message : 'checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
