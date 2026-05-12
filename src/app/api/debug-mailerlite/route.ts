import { NextResponse } from 'next/server'
import { mailerLiteFetch } from '@/lib/mailerLiteClient'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try a few approaches to find total count
    const subscribersList = await mailerLiteFetch('/subscribers', {
      query: { limit: 1, 'filter[status]': 'active' },
    })

    const groups = await mailerLiteFetch('/groups').catch(() => null)

    const stats = await mailerLiteFetch('/stats').catch(() => null)

    return NextResponse.json({
      subscribers_meta: (subscribersList as { meta?: unknown })?.meta || null,
      subscribers_keys: subscribersList ? Object.keys(subscribersList) : null,
      groups_sample: groups,
      stats_sample: stats,
    })
  } catch (err) {
    const e = err as Error
    return NextResponse.json({ error: e.message }, { status: 500 }) 
  }
}
