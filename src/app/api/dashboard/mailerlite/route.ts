import { NextResponse } from 'next/server'
import { mailerLiteFetch } from '@/lib/mailerLiteClient'

export const dynamic = 'force-dynamic'

type SubscribersListResponse = {
  data: Array<{
    id: string
    email: string
    status: string
    subscribed_at: string | null
    created_at: string
  }>
  meta?: {
    total?: number
    count?: number
    last?: number
    current_page?: number
  }
}

async function countByStatus(status: string): Promise<number> {
  try {
    const res = await mailerLiteFetch<SubscribersListResponse>('/subscribers', {
      query: {
        'filter[status]': status,
        limit: 1,
      },
    })
    return res.meta?.total ?? 0
  } catch {
    return 0
  }
}

export async function GET() {
  try {
    // Parallel fetch all status counts
    const [active, unsubscribed, unconfirmed, bounced, junk] = await Promise.all([
      countByStatus('active'),
      countByStatus('unsubscribed'),
      countByStatus('unconfirmed'),
      countByStatus('bounced'),
      countByStatus('junk'),
    ])

    const total = active + unsubscribed + unconfirmed + bounced + junk

    // New subscribers last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    let newSubsLast7Days = 0

    try {
      const recentSubs = await mailerLiteFetch<SubscribersListResponse>(
        '/subscribers',
        {
          query: {
            'filter[status]': 'active',
            limit: 100,
            sort: '-subscribed_at',
          },
        }
      )

      if (recentSubs.data) {
        const cutoff = sevenDaysAgo.getTime()
        newSubsLast7Days = recentSubs.data.filter((s) => {
          const subscribedAt = s.subscribed_at || s.created_at
          return subscribedAt && new Date(subscribedAt).getTime() >= cutoff
        }).length
      }
    } catch {
      // Continue if recent subs fetch fails
    }

    return NextResponse.json({
      success: true,
      stats: {
        total,
        active,
        unsubscribed,
        unconfirmed,
        bounced,
        junk,
      },
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
