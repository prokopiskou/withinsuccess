import { NextRequest, NextResponse } from 'next/server'
import { simulate } from '@/lib/igFlow'

export const dynamic = 'force-dynamic'

/** «Δοκιμή»: όλη η ροή με ψεύτικο χρήστη, χωρίς να φύγει τίποτα */
export async function POST(req: NextRequest) {
  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const messages = await simulate(String(id))
  return NextResponse.json({ messages })
}
