import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subscriberId = String(body.subscriber_id || body.id || '')
    const text = body.last_input_text || body.text || ''
    const source = body.source || 'dm'

    if (!subscriberId || !text) {
      return NextResponse.json({ error: 'missing data' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('manychat_conversations')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .eq('flow', 'concierge')
      .maybeSingle()

    if (existing) {
      await supabaseAdmin.rpc('append_message', {
        p_subscriber_id: subscriberId,
        p_message: JSON.stringify({ role: 'user', content: text }),
        p_last_user_message: text
      })
    } else {
      await supabaseAdmin
        .from('manychat_conversations')
        .insert({
          subscriber_id: subscriberId,
          flow: 'concierge',
          source: source,
          messages: [{ role: 'user', content: text }],
          last_user_message: text,
          received_at: new Date().toISOString(),
          status: 'pending'
        })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Concierge webhook error:', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
