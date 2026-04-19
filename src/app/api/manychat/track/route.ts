import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, setManyChatField } from '@/lib/manychat-utils'

export async function POST(req: NextRequest) {
  try {
    const { subscriber_id } = await req.json()
    if (!subscriber_id) return NextResponse.json({ personalized: false })

    const { data, error } = await supabaseAdmin
      .from('manychat_conversations')
      .select('personalized_headline, personalized_subheadline, personalized_bullets, pain_keywords')
      .eq('subscriber_id', subscriber_id)
      .single()

    if (error || !data) return NextResponse.json({ personalized: false })

    await supabaseAdmin
      .from('manychat_conversations')
      .update({ link_clicked_at: new Date().toISOString() })
      .eq('subscriber_id', subscriber_id)
    await supabaseAdmin
      .from('manychat_conversations')
      .update({ status: 'page_visited' })
      .eq('subscriber_id', subscriber_id)
      .in('status', ['link_sent', 'answered'])
    await setManyChatField(subscriber_id, 14490100, 'yes')

    return NextResponse.json({
      personalized: !!(data.personalized_headline),
      headline: data.personalized_headline,
      subheadline: data.personalized_subheadline,
      bullets: data.personalized_bullets,
      keywords: data.pain_keywords
    })
  } catch {
    return NextResponse.json({ personalized: false })
  }
}
