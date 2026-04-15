import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, hoursSince } from '@/lib/manychat-utils'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: rows } = await supabaseAdmin
    .from('manychat_conversations')
    .select('*')
    .order('received_at', { ascending: false })

  if (!rows?.length) return NextResponse.json({ total: 0, followups: [], active: [] })

  const followups: any[] = []
  const active: any[] = []

  for (const row of rows) {
    const base = {
      subscriber_id: row.subscriber_id,
      lead_score: row.lead_score,
      last_message: row.last_user_message,
      status: row.status,
      messages_count: row.messages?.length || 0,
    }

    if (row.status === 'link_sent' && !row.link_clicked_at && row.link_sent_at && hoursSince(row.link_sent_at) >= 5) {
      followups.push({
        ...base,
        type: 'no_click',
        hours_since: Math.round(hoursSince(row.link_sent_at)),
        suggested_message: 'Αν κάτι δεν είναι σαφές για το πρόγραμμα, οποιαδήποτε στιγμή μου γράφεις.'
      })
    } else if (row.checkout_started_at && !row.payment_completed_at && hoursSince(row.checkout_started_at) >= 2) {
      followups.push({
        ...base,
        type: 'abandoned_checkout',
        hours_since: Math.round(hoursSince(row.checkout_started_at)),
        suggested_message: 'Είδα ότι ξεκίνησες την κατοχύρωση. Αν υπήρξε κάποιο πρόβλημα, είμαι εδώ.'
      })
    } else if (row.status === 'pending' || row.status === 'answered') {
      active.push(base)
    }
  }

  return NextResponse.json({ total: rows.length, followups, active })
}
