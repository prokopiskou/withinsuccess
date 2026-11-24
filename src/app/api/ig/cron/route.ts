import { NextRequest, NextResponse } from 'next/server'
import { refreshToken } from '@/lib/igClient'

export const dynamic = 'force-dynamic'

/** Κάθε Δευτέρα: ανανέωση του Instagram token (λήγει σε 60 μέρες αν δεν ανανεωθεί) */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const r = await refreshToken()
  if (!r.ok) console.error('[IG] token refresh failed', r.error)
  return NextResponse.json(r, { status: r.ok ? 200 : 500 })
}
