import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import crypto from 'crypto'
import { supabaseAdmin, setManyChatField } from '@/lib/manychat-utils'
import { getStripeClient } from '@/lib/stripeClient'

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

function getProductConfig(amount: number, metadata?: Record<string, string>): ProductConfig {
  // PRIORITY 1: metadata.product (set explicitly by create-session)
  const product = (metadata?.product || '').toLowerCase().trim()
  
  if (product === '63days') {
    console.log(`[PRODUCT] Matched 63days via metadata.product (amount: ${amount})`)
    return {
      name: '63 Μέρες Ζωής',
      mailerLiteGroup: '170438323755550313',
      syncManyChat: true,
      manyChatField: 14490102
    }
  }
  
  if (product === '30days') {
    console.log(`[PRODUCT] Matched 30days via metadata.product (amount: ${amount})`)
    return {
      name: '30 Μέρες',
      mailerLiteGroup: '148420836003415194',
      syncManyChat: false
    }
  }
  
  // PRIORITY 2: metadata.product_name
  const productName = (metadata?.product_name || '').toLowerCase()
  
  if (productName.includes('63')) {
    console.log(`[PRODUCT] Matched 63days via product_name (amount: ${amount})`)
    return {
      name: '63 Μέρες Ζωής',
      mailerLiteGroup: '170438323755550313',
      syncManyChat: true,
      manyChatField: 14490102
    }
  }
  
  if (productName.includes('30')) {
    console.log(`[PRODUCT] Matched 30days via product_name (amount: ${amount})`)
    return {
      name: '30 Μέρες',
      mailerLiteGroup: '148420836003415194',
      syncManyChat: false
    }
  }
  
  // PRIORITY 3: Amount-based fallback with safer bands
  // 63 Days has been priced: €69 / €89 / €109
  if (amount >= 60 && amount <= 120) {
    console.log(`[PRODUCT] Matched 63days via amount band ${amount}`)
    return {
      name: '63 Μέρες Ζωής',
      mailerLiteGroup: '170438323755550313',
      syncManyChat: true,
      manyChatField: 14490102
    }
  }
  
  // 30 Days: only exact €15 (avoid edge cases like discounts)
  if (amount === 15) {
    console.log(`[PRODUCT] Matched 30days via exact amount 15`)
    return {
      name: '30 Μέρες',
      mailerLiteGroup: '148420836003415194',
      syncManyChat: false
    }
  }
  
  // PRIORITY 4: Final safe fallback → 63 Days (safer to not auto-send 30 day emails)
  console.warn(`[PRODUCT] UNKNOWN product (amount: ${amount}, metadata:`, metadata, ') — defaulting to 63days group')
  return {
    name: 'WithinSuccess Program',
    mailerLiteGroup: '170438323755550313',
    syncManyChat: false
  }
}

// ============================================================
// NAME FIXER — Greek vocative case (κλητική) via Claude Haiku
// "ΠΡΟΚΟΠΗΣ ΚΟΥΚΗΣ" → "Προκόπη" (για να φωνάζεις τον πελάτη σε email)
// ============================================================
async function fixName(rawName: string): Promise<string> {
  if (!rawName || !rawName.trim()) return ''
  
  // Fallback if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return rawName.split(/\s+/)[0]
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `Δίνεται όνομα πελάτη από φόρμα αγοράς: "${rawName}"

Επέστρεψε ΜΟΝΟ το μικρό όνομα στην ΚΛΗΤΙΚΗ ΠΤΩΣΗ (όπως θα φωνάξεις το άτομο σε email), με σωστή κεφαλαία στο πρώτο γράμμα, ΧΩΡΙΣ εισαγωγικά, ΧΩΡΙΣ εξήγηση, ΜΟΝΟ μια λέξη.

Παραδείγματα:
"ΠΡΟΚΟΠΗΣ ΚΟΥΚΗΣ" → Προκόπη
"prokopis koukis" → Προκόπη
"Νίκος Παπαδόπουλος" → Νίκο
"Πέτρος" → Πέτρο
"Παύλος" → Παύλο
"Γιώργος" → Γιώργο
"Στέλιος" → Στέλιο
"Χρήστος" → Χρήστο
"Δημήτρης Σταυρόπουλος" → Δημήτρη
"Μιχάλης" → Μιχάλη
"Γιάννης" → Γιάννη
"Παναγιώτης" → Παναγιώτη
"Αντώνης" → Αντώνη
"Θανάσης" → Θανάση
"Νικόλας" → Νικόλα
"Κώστας" → Κώστα
"Μαρία Παπαδοπούλου" → Μαρία
"Ελένη" → Ελένη
"Αλεξάνδρα" → Αλεξάνδρα
"Σοφία" → Σοφία
"John Smith" → John
"Maria Costa" → Maria
"Anna" → Anna

Κανόνες κλητικής (φιλική/καθημερινή χρήση):
- Αρσενικά σε -ης → -η (Προκόπης→Προκόπη, Δημήτρης→Δημήτρη)
- Αρσενικά σε -ος → -ο (Νίκος→Νίκο, Πέτρος→Πέτρο, Παύλος→Παύλο, Στέλιος→Στέλιο)
- Αρσενικά σε -ας → -α (Νικόλας→Νικόλα, Κώστας→Κώστα)
- Θηλυκά → αμετάβλητα
- Ξενόγλωσσα → αμετάβλητα`
        }]
      })
    })
    
    if (!response.ok) {
      console.error(`Claude name fix error (${response.status})`)
      return rawName.split(/\s+/)[0]
    }
    
    const data = await response.json()
    const fixed = data.content?.[0]?.text?.trim() || ''
    
    // Safety: if fixed is empty or too long, fallback to raw first word
    if (!fixed || fixed.length > 30 || fixed.split(/\s+/).length > 2) {
      console.warn(`fixName returned suspicious result: "${fixed}" - using fallback`)
      return rawName.split(/\s+/)[0]
    }
    
    return fixed
  } catch (err) {
    console.error('fixName failed:', err)
    return rawName.split(/\s+/)[0]
  }
}

// ============================================================
// META CONVERSIONS API
// ============================================================
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

// ============================================================
// OXYGEN INVOICING
// ============================================================
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

// ============================================================
// MAILERLITE
// ============================================================
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

    // 3. Fix name to vocative case + add to MailerLite (correct group)
    if (email) {
      const fixedFirstName = await fixName(rawFullName)
      const nameParts = rawFullName.trim().split(/\s+/)
      const lastName = nameParts.slice(1).join(' ') || ''
      
      await addToMailerLite(email, fixedFirstName, lastName, product.mailerLiteGroup)
    }

    // 4. Create Oxygen invoice (use raw full name for legal/tax purposes)
    const customerEmail = session.customer_email || session.customer_details?.email || ''
    await createOxygenInvoice(
      rawFullName.trim(),
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