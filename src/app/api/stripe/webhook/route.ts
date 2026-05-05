import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'
import { supabaseAdmin, setManyChatField } from '@/lib/manychat-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia'
})

const META_PIXEL_ID = '1653590555890252'

/**
 * Στέλνει Purchase event στο Meta Conversions API.
 * Δουλεύει server-side, άρα δεν χάνει data από ad blockers.
 */
async function sendMetaPurchaseEvent(params: {
  email: string | null | undefined
  phone?: string | null
  amount: number
  eventSourceUrl?: string
  eventId?: string
}) {
  if (!process.env.META_CAPI_ACCESS_TOKEN) {
    console.log('Meta CAPI token missing, skipping server-side event')
    return
  }

  const userData: Record<string, string[]> = {}

  if (params.email) {
    const hashedEmail = crypto
      .createHash('sha256')
      .update(params.email.toLowerCase().trim())
      .digest('hex')
    userData.em = [hashedEmail]
  }

  if (params.phone) {
    const cleanPhone = params.phone.replace(/[^\d]/g, '')
    const hashedPhone = crypto
      .createHash('sha256')
      .update(cleanPhone)
      .digest('hex')
    userData.ph = [hashedPhone]
  }

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
            event_id: params.eventId, // για deduplication με client pixel
            action_source: 'website',
            event_source_url: params.eventSourceUrl || 'https://withinsuccess.gr/63days',
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
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`Meta CAPI error (${res.status}):`, errorText)
    } else {
      console.log(`Meta Purchase event sent: €${params.amount}`)
    }
  } catch (err) {
    console.error('Meta CAPI fetch failed:', err)
  }
}

async function createOxygenInvoice(customerName: string, customerEmail: string, amount: number, productName: string) {
  const OXYGEN_API_KEY = process.env.OXYGEN_API_KEY
  if (!OXYGEN_API_KEY) return

  const baseUrl = 'https://api.oxygen.gr/v1'

  // Create or find contact
  const contactRes = await fetch(`${baseUrl}/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OXYGEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: customerName,
      email: customerEmail,
    }),
  })
  const contact = await contactRes.json()
  const contactId = contact?.id

  // Create notice (απόδειξη)
  await fetch(`${baseUrl}/notices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OXYGEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contact_id: contactId,
      items: [
        {
          description: productName,
          quantity: 1,
          price: amount / 100,
          tax_id: "331db5c0-d118-11f0-8710-fa163eb3df25"
        }
      ],
    }),
  })
}

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

    // 1. Στείλε Purchase event στο Meta (server-side)
    // Αυτό δουλεύει ΑΝΕΞΑΡΤΗΤΑ αν υπάρχει subscriberId
    await sendMetaPurchaseEvent({
      email,
      phone,
      amount,
      eventId: session.id, // Stripe session ID ως event_id για deduplication
      eventSourceUrl: 'https://withinsuccess.gr/63days'
    })

    // 2. Update Supabase (μόνο αν έχουμε subscriberId από DM agent)
    if (subscriberId) {
      await supabaseAdmin
        .from('manychat_conversations')
        .update({
          payment_completed_at: new Date().toISOString(),
          status: 'paid'
        })
        .eq('subscriber_id', subscriberId)
      
      // 3. Update ManyChat custom field
      await setManyChatField(subscriberId, 14490102, 'yes')
    }

    // 4. Add στο MailerLite buyers group
    if (email) {
      try {
        const fullName = session.customer_details?.name || ''
        const nameParts = fullName.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

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
            groups: ['170438323755550313']
          })
        })
        
        if (!mlRes.ok) {
          console.error(`MailerLite error (${mlRes.status}):`, await mlRes.text())
        }
      } catch (err) {
        console.error('MailerLite fetch failed:', err)
      }
    }

    const cleanName = (session.customer_details?.name || '').trim()
    const customerEmail = session.customer_email || session.customer_details?.email || ''
    await createOxygenInvoice(
      cleanName,
      customerEmail,
      session.amount_total || 0,
      session.metadata?.product_name || 'WithinSuccess Program'
    )

    return NextResponse.json({ received: true, processed: 'purchase' })
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

  // Άγνωστο event type — return received χωρίς action
  return NextResponse.json({ received: true })
}