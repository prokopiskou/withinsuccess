import { NextRequest, NextResponse } from 'next/server'
import { processFollowups } from '@/lib/igFlow'

export const dynamic = 'force-dynamic'

/** Κάθε λεπτό (από Supabase pg_cron): στέλνει τα follow-up που έχουν έρθει η ώρα τους */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const r = await processFollowups()
  return NextResponse.json(r)
}
