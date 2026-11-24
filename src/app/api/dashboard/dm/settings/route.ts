import { NextRequest, NextResponse } from 'next/server'
import { setSetting } from '@/lib/igClient'

export const dynamic = 'force-dynamic'

/** Dry-run on/off */
export async function POST(req: NextRequest) {
  const { dry_run } = await req.json().catch(() => ({}))
  await setSetting('dry_run', dry_run ? '1' : '0')
  return NextResponse.json({ ok: true })
}
