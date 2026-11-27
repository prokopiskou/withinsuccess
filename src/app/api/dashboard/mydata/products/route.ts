import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('mydata_products').select('*').order('created_at')
  return NextResponse.json({ products: data || [], error: error?.message || null })
}

/** add | update | delete */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const name = String(b.name || '').trim().slice(0, 120)
  const price = Number(b.price)
  if (b.action === 'delete') {
    await supabaseAdmin.from('mydata_products').update({ active: false }).eq('id', b.id)
    return NextResponse.json({ ok: true })
  }
  if (!name || !(price > 0)) return NextResponse.json({ error: 'Όνομα και τιμή' }, { status: 400 })
  if (b.action === 'update') {
    await supabaseAdmin.from('mydata_products').update({ name, price }).eq('id', b.id)
  } else {
    await supabaseAdmin.from('mydata_products').insert({ name, price })
  }
  return NextResponse.json({ ok: true })
}
