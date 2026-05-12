import { NextResponse } from 'next/server'
import { mailerLiteFetch } from '@/lib/mailerLiteClient'

export const dynamic = 'force-dynamic'

type SubscriberCountResponse = {
  data: {
    total: number
    active: number
    unsubscribed: number
    unconfirmed: number
    bounced: number
    junk: number
  }
}

type SubscribersListResponse = {
  data: Array<{
    id: string
    email: string
    status: string
    subscribed_at: string | null
    created_at: string
  }>
  meta: {
    total: number
  }
}

export async function GET() {
  try {
    // Get overall subscriber stats
    const stats = await mailerLiteFetch<SubscriberCountResponse>(
      '/subscribers/count'
    ).catch(() => null)

    // Get last 7 days new subscribers
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const recentSubs = await mailerLiteFetch<SubscribersListResponse>(
      '/subscribers',
      {
        query: {
          'filter[status]': 'active',
          limit: 100,
        },
      }
    ).catch(() => null)

    // Count new subscribers in last 7 days
    let newSubsLast7Days = 0
    if (recentSubs?.data) {
      const cutoff = new Date(sevenDaysAgo).getTime()
      newSubsLast7Days = recentSubs.data.filter((s) => {
        const subscribedAt = s.subscribed_at || s.created_at
        return subscribedAt && new Date(subscribedAt).getTime() >= cutoff
      }).length
    }

    return NextResponse.json({
      success: true,
      stats: stats?.data || null,
      newSubscribersLast7Days: newSubsLast7Days,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const e = err as Error
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    )
  }
}
