import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'
import { getAccount, hasToken, isDryRun } from '@/lib/igClient'
import { clean, type AutomationInput } from '@/lib/igAutomationInput'

export const dynamic = 'force-dynamic'

export async function GET() {
  const tokenSet = await hasToken()
  const [autos, funnel, contacts, dry] = await Promise.all([
    supabaseAdmin.from('ig_automations').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('ig_funnel').select('*'),
    supabaseAdmin
      .from('ig_threads')
      .select('id, automation_id, username, ig_user_id, source, comment_text, stage, follows, created_at, dm_sent_at, tapped_at, link_sent_at, clicked_at, followup_sent_at, last_error')
      .not('ig_user_id', 'like', 'sim_%')
      .order('created_at', { ascending: false })
      .limit(200),
    isDryRun(),
  ])

  if (autos.error) {
    return NextResponse.json({ error: `Βάση: ${autos.error.message}. Έτρεξες το supabase/ig-dm.sql;` }, { status: 500 })
  }

  const account = tokenSet
    ? await getAccount()
        .then(a => ({ ok: true as const, username: a.username }))
        .catch((e: Error) => ({ ok: false as const, error: e.message.slice(0, 200) }))
    : { ok: false as const, error: 'Δεν έχει μπει ακόμα token' }

  return NextResponse.json({
    automations: autos.data,
    funnel: funnel.data || [],
    contacts: contacts.data || [],
    account,
    tokenSet,
    dryRun: dry,
  })
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as AutomationInput
  const c = clean(body)
  if (typeof c === 'string') return NextResponse.json({ error: c }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('ig_automations').insert(c).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ automation: data })
}
