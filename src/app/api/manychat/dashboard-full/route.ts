import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'
const DASHBOARD_PASSWORD = 'prokopis2026'
export async function GET(req: NextRequest) {
const pw = req.headers.get('x-dashboard-pw')
if (pw !== DASHBOARD_PASSWORD) {
return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
const { data: conversations } = await supabaseAdmin
.from('manychat_conversations')
.select('*')
.order('received_at', { ascending: false })
.limit(200)
return NextResponse.json({ conversations: conversations || [] })
}
