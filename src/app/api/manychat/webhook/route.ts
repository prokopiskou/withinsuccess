import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subscriberId = body.subscriber_id
    const userMessage = body.message?.text

    if (!subscriberId || !userMessage) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('manychat_conversations')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase fetch error:', fetchError)
      return NextResponse.json({ error: 'db error' }, { status: 500 })
    }

    const messages = existing?.messages || []
    messages.push({ role: 'user', content: userMessage })

    if (existing) {
      await supabaseAdmin
        .from('manychat_conversations')
        .update({
          messages,
          last_user_message: userMessage,
          received_at: new Date().toISOString(),
          answered_at: null,
          status: 'pending'
        })
        .eq('subscriber_id', subscriberId)
    } else {
      await supabaseAdmin.from('manychat_conversations').insert({
        subscriber_id: subscriberId,
        messages: [{ role: 'assistant', content: 'Γεια σου, έλαβα το 63 σου και θα ήθελα για αρχή να σε ρωτήσω, τι είναι αυτό που θα ήθελες να αλλάξεις μέσα από το πρόγραμμα;' }, { role: 'user', content: userMessage }],
        last_user_message: userMessage,
        received_at: new Date().toISOString(),
        status: 'pending'
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}