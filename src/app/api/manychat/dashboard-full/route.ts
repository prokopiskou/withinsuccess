import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'

const DASHBOARD_PASSWORD = 'prokopis2026'

export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-dashboard-pw')
  if (pw !== DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')

  let query = supabaseAdmin
    .from('manychat_conversations')
    .select('*')
    .neq('status', 'human_needed')
    .neq('status', 'expired')
    .order('received_at', { ascending: false })
    .limit(500)

  if (fromDate) query = query.gte('received_at', fromDate)
  if (toDate) query = query.lte('received_at', toDate)

  const { data: conversations } = await query

  return NextResponse.json({ conversations: conversations || [] })
}

export async function DELETE(req: NextRequest) {
  const pw = req.headers.get('x-dashboard-pw')
  if (pw !== DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  await supabaseAdmin.from('manychat_conversations').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const pw = req.headers.get('x-dashboard-pw')
  if (pw !== DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'missing data' }, { status: 400 })

  await supabaseAdmin.from('manychat_conversations').update({ status }).eq('id', id)
  return NextResponse.json({ ok: true })
}
