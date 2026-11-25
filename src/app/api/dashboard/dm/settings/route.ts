import { NextRequest, NextResponse } from 'next/server'
import { setSetting, subscribeWebhooks } from '@/lib/igClient'

export const dynamic = 'force-dynamic'

/** Dry-run on/off · ID λογαριασμού Instagram · σύνδεση webhooks */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  if (body.action === 'subscribe') {
    try {
      const r = await subscribeWebhooks()
      return NextResponse.json(r, { status: r.ok ? 200 : 400 })
    } catch (e) {
      return NextResponse.json({ ok: false, text: (e as Error).message }, { status: 400 })
    }
  }

  if (typeof body.ig_user_id === 'string') {
    const id = body.ig_user_id.trim()
    if (!/^\d{5,25}$/.test(id)) return NextResponse.json({ error: 'Το ID είναι μόνο αριθμοί' }, { status: 400 })
    await setSetting('ig_user_id', id)
    return NextResponse.json({ ok: true })
  }

  if ('dry_run' in body) {
    await setSetting('dry_run', body.dry_run ? '1' : '0')
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'nothing to do' }, { status: 400 })
}
