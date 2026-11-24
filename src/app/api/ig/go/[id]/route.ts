import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/manychat-utils'
import { SITE_URL } from '@/lib/igClient'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9Ͱ-Ͽ]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

/** Κλικ από το DM → μετράμε → redirect στο link με UTM */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.redirect(SITE_URL)

  const { data: th } = await supabaseAdmin
    .from('ig_threads')
    .select('id, clicked_at, ig_automations(name, link_url)')
    .eq('id', id)
    .maybeSingle()

  const auto = (Array.isArray(th?.ig_automations) ? th?.ig_automations[0] : th?.ig_automations) as
    | { name: string; link_url: string | null }
    | null
    | undefined
  if (!th || !auto?.link_url) return NextResponse.redirect(SITE_URL)

  if (!th.clicked_at) {
    await supabaseAdmin.from('ig_threads').update({ clicked_at: new Date().toISOString(), stage: 'clicked' }).eq('id', th.id)
  }

  let target: URL
  try {
    target = new URL(auto.link_url)
  } catch {
    return NextResponse.redirect(SITE_URL)
  }
  if (!target.searchParams.has('utm_source')) {
    target.searchParams.set('utm_source', 'instagram')
    target.searchParams.set('utm_medium', 'dm')
    target.searchParams.set('utm_campaign', slug(auto.name) || 'within-dm')
  }
  return NextResponse.redirect(target.toString(), 302)
}
