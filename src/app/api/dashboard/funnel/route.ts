import { NextRequest, NextResponse } from 'next/server'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'
import { getStripeClient } from '@/lib/stripeClient'

export const dynamic = 'force-dynamic'

function toGA4Date(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * GET /api/dashboard/funnel?start=ISO&end=ISO
 *
 * Returns conversion funnel data:
 * - sessions: GA4 total sessions
 * - engagedSessions: GA4 sessions with engagement
 * - viewedPricing: count of view_pricing or pricing_view events
 * - beganCheckout: count of begin_checkout events
 * - purchased: count of successful Stripe charges
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')

    const end = endStr ? new Date(endStr) : new Date()
    const start = startStr
      ? new Date(startStr)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // GA4 query
    const ga4Client = getGA4Client()
    const propertyPath = getPropertyPath()
    const startDate = toGA4Date(start)
    const endDate = toGA4Date(end)

    // Get sessions + engaged sessions
    const sessionsResp = await ga4Client.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
        ],
      },
    })

    const sessions = parseInt(sessionsResp.data.rows?.[0]?.metricValues?.[0]?.value || '0', 10)
    const engagedSessions = parseInt(sessionsResp.data.rows?.[0]?.metricValues?.[1]?.value || '0', 10)

    // Get specific event counts (view_pricing, begin_checkout)
    const eventsResp = await ga4Client.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: ['view_pricing', 'pricing_view', 'view_item', 'begin_checkout', 'checkout_started'],
            },
          },
        },
      },
    })

    let viewedPricing = 0
    let beganCheckout = 0

    eventsResp.data.rows?.forEach((row) => {
      const eventName = row.dimensionValues?.[0]?.value || ''
      const count = parseInt(row.metricValues?.[0]?.value || '0', 10)

      if (eventName === 'view_pricing' || eventName === 'pricing_view' || eventName === 'view_item') {
        viewedPricing += count
      } else if (eventName === 'begin_checkout' || eventName === 'checkout_started') {
        beganCheckout += count
      }
    })

    // Stripe successful purchases
    const stripe = getStripeClient()
    const startTs = Math.floor(start.getTime() / 1000)
    const endTs = Math.floor(end.getTime() / 1000)

    let purchased = 0
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const batch = await stripe.charges.list({
        limit: 100,
        created: { gte: startTs, lte: endTs },
        starting_after: startingAfter,
      })

      for (const c of batch.data) {
        if (c.status === 'succeeded' && !c.refunded) {
          purchased++
        }
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
    }

    return NextResponse.json({
      success: true,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      funnel: [
        { stage: 'Sessions', count: sessions, label: 'Επισκέψεις' },
        { stage: 'Engaged', count: engagedSessions, label: 'Engagement' },
        { stage: 'Viewed Pricing', count: viewedPricing, label: 'Είδαν τιμή' },
        { stage: 'Began Checkout', count: beganCheckout, label: 'Ξεκίνησαν checkout' },
        { stage: 'Purchased', count: purchased, label: 'Πληρωμή' },
      ],
    })
  } catch (err) {
    const e = err as Error
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    )
  }
}
