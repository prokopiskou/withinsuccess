import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/manychat-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia'
})

export async function POST(req: NextRequest) {
  try {
    const { subscriber_id } = await req.json()
    if (!subscriber_id) {
      return NextResponse.json({ error: 'missing subscriber_id' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1
      }],
      metadata: { subscriber_id, source: 'manychat_agent' },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/63days/success?sid=${subscriber_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/63days?sid=${subscriber_id}`,
      expires_at: Math.floor(Date.now() / 1000) + 1800
    })

    await supabaseAdmin
      .from('manychat_conversations')
      .update({
        stripe_session_id: session.id,
        checkout_started_at: new Date().toISOString()
      })
      .eq('subscriber_id', subscriber_id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe session error:', err)
    return NextResponse.json({ error: 'checkout failed' }, { status: 500 })
  }
}
