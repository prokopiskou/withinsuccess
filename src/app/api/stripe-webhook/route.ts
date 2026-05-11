import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'
import { supabaseAdmin, setManyChatField } from '@/lib/manychat-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia'
})

const META_PIXEL_ID = '1653590555890252'

// ============================================================
// PRODUCT CONFIGURATION
// ============================================================
type ProductConfig = {
  name: string
  mailerLiteGroup: string
  syncManyChat: boolean
  manyChatField?: number
}

function getProductConfig(amount: number, metadata?: Record<string, string>): ProductConfig {
  const productName = metadata?.product_name?.toLowerCase() || ''
  
  // Match by metadata first (most reliable), then by amount
  if (productName.includes('63') || amount === 89) {
    return {
      name: '63 Μέρες Ζωής',
      mailerLiteGroup: '170438323755550313',
      syncManyChat: true,
      manyChatField: 14490102
    }
  }
  
  if (productName.includes('30') || amount === 15) {
    return {
      name: '30 Μέρες',
      mailerLiteGroup: '148420836003415194',
      syncManyChat: false
    }
  }
  
  // Fallback: log warning, default to 63days group (safest for ad tracking)
  console.warn(`Unknown product (amount: ${amount}, metadata:`, metadata, ') — defaulting to 63days group')
  return {
    name: 'WithinSuccess Program',
    mailerLiteGroup: '170438323755550313',
    syncManyChat: false
  }
}

/**
 * Στέλνει Purchase event στο Meta Conversions API.
 * Δουλεύει server-side, άρα δεν χάνει data από ad blockers.
 */
async function sendMetaPurchaseEvent(params: {
  email: string | null | undefined
  phone?: string | null
  amount: number
  productName: string
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

async function createOxygenInvoice(customerName: string, customerEmail: string, amount: number, productName: string) {
  const OXYGEN_API_KEY = process.env.OXYGEN_API_KEY
  if (!OXYGEN_API_KEY) return

  const baseUrl = 'https://api.oxygen.gr/v1'

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

  const noticeRes = await fetch(`${baseUrl}/notices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OXYGEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contact_id: contactId,
      numbering_sequence_id: "33212260-d118-11f0-8710-fa163eb3df25",
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

  const notice = await noticeRes.json()
  const noticeId = notice?.data?.id || notice?.id

  if (noticeId && customerEmail) {
    await fetch(`${baseUrl}/notices/${noticeId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OXYGEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
      }),
    })
  }
}

async function addToMailerLite(email: string, firstName: string, lastName: string, groupId: string) {
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
      console.log(`MailerLite: ${email} added to group ${groupId}`)
    }
  } catch (err) {
    console.error('MailerLite fetch failed:', err)
  }
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

    // Determine which product was purchased
    const product = getProductConfig(amount, session.metadata as Record<string, string>)
    console.log(`Purchase: €${amount} → ${product.name} (group ${product.mailerLiteGroup})`)

    // 1. Send Purchase event to Meta CAPI
    await sendMetaPurchaseEvent({
      email,
      phone,
      amount,
      productName: product.name,
      eventId: session.id,
      eventSourceUrl: amount === 15 
        ? 'https://withinsuccess.gr/30days' 
        : 'https://withinsuccess.gr/63days'
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

    // 3. Add to MailerLite (correct group based on product)
    if (email) {
      const fullName = session.customer_details?.name || ''
      const nameParts = fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      await addToMailerLite(email, firstName, lastName, product.mailerLiteGroup)
    }

    // 4. Create Oxygen invoice
    const cleanName = (session.customer_details?.name || '').trim()
    const customerEmail = session.customer_email || session.customer_details?.email || ''
    await createOxygenInvoice(
      cleanName,
      customerEmail,
      session.amount_total || 0,
      session.metadata?.product_name || product.name
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