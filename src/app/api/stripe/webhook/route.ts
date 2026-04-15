import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin, setManyChatField } from '@/lib/manychat-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia'
})

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

  const session = event.data.object as Stripe.Checkout.Session
  const subscriberId = session.metadata?.subscriber_id

  if (!subscriberId) {
    return NextResponse.json({ received: true })
  }

  if (event.type === 'checkout.session.completed') {
    await supabaseAdmin
      .from('manychat_conversations')
      .update({
        payment_completed_at: new Date().toISOString(),
        status: 'converted'
      })
      .eq('subscriber_id', subscriberId)
    const sid = session.metadata?.subscriber_id
    if (sid) await setManyChatField(sid, 14490102, 'yes')
  }

  if (event.type === 'checkout.session.expired') {
    console.log(`Checkout expired: ${subscriberId}`)
  }

  return NextResponse.json({ received: true })
}
