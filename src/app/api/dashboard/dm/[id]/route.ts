import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'
import { clean, type AutomationInput } from '@/lib/igAutomationInput'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as AutomationInput
  const c = clean(body, true)
  if (typeof c === 'string') return NextResponse.json({ error: c }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('ig_automations')
    .update({ ...c, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ automation: data })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('ig_automations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
