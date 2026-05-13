import { NextRequest, NextResponse } from 'next/server'
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
  }
}

/**
 * GET /api/dashboard/mailerlite?start=ISO&end=ISO
 * 
 * Returns MailerLite metrics for the date range:
 * - newSubscribersInRange: count of subscribers created within the date range
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')

    // Default: last 7 days
    const end = endStr ? new Date(endStr) : new Date()
    const start = startStr
      ? new Date(startStr)
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)

    const startTime = start.getTime()
    const endTime = end.getTime()

    // Fetch active subscribers sorted by most recent first
    // We paginate until we get past the start date
    let newSubsInRange = 0
    let pageCursor: string | undefined
    let pageCount = 0
    const MAX_PAGES = 20 // Safety cap (20 * 100 = 2000 subscribers checked)

    try {
      while (pageCount < MAX_PAGES) {
        const query: Record<string, string | number> = {
          'filter[status]': 'active',
          limit: 100,
          sort: '-subscribed_at',
        }
        if (pageCursor) {
          query.cursor = pageCursor
        }

        const res = await mailerLiteFetch<SubscribersListResponse & { meta?: { next_cursor?: string } }>(
          '/subscribers',
          { query }
        )

        if (!res.data || res.data.length === 0) break

        let pageHasOlderThanStart = false

        for (const sub of res.data) {
          const subAt = sub.subscribed_at || sub.created_at
          if (!subAt) continue
          const subTime = new Date(subAt).getTime()

          if (subTime >= startTime && subTime <= endTime) {
            newSubsInRange++
          } else if (subTime < startTime) {
            pageHasOlderThanStart = true
          }
        }

        // Stop if we've seen subscribers older than start
        if (pageHasOlderThanStart) break

        // Get next cursor for pagination
        pageCursor = res.meta?.next_cursor
        if (!pageCursor) break

        pageCount++
      }
    } catch (err) {
      // If pagination fails, return what we have
      console.error('[MailerLite] Pagination error:', err)
    }

    return NextResponse.json({
      success: true,
      newSubscribersInRange: newSubsInRange,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
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
