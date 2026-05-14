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

// Page path prefixes per product
const PRODUCT_PAGES: Record<string, string[]> = {
  '63days': ['/63days'],
  '30days': ['/30days'],
  'coaching': ['/work', '/apply'],
}

function detectStripeProduct(amount: number, metadata: Record<string, string>): string {
  if (metadata.product === '63days') return '63days'
  if (metadata.product === '30days') return '30days'
  if (metadata.product === 'coaching') return 'coaching'
  const eur = amount / 100
  if (eur >= 65 && eur <= 119) return '63days'
  if (eur >= 13 && eur <= 19) return 'coaching'  // €15 single session
  if (eur >= 120 && eur <= 500) return 'coaching' // packages
  return 'other'
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')
    const productFilter = searchParams.get('product') // optional: '63days' | '30days' | 'coaching'

    const end = endStr ? new Date(endStr) : new Date()
    const start = startStr
      ? new Date(startStr)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    const ga4Client = getGA4Client()
    const propertyPath = getPropertyPath()
    const startDate = toGA4Date(start)
    const endDate = toGA4Date(end)

    // Build pagePath filter if product specified
    const pagePrefixes = productFilter ? PRODUCT_PAGES[productFilter] : null
    
    // Build a dimensionFilter that matches any of the page prefixes
    let pagePathFilter = undefined
    if (pagePrefixes && pagePrefixes.length > 0) {
      if (pagePrefixes.length === 1) {
        pagePathFilter = {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'BEGINS_WITH' as const,
              value: pagePrefixes[0],
            },
          },
        }
      } else {
        pagePathFilter = {
          orGroup: {
            expressions: pagePrefixes.map((prefix) => ({
              filter: {
                fieldName: 'pagePath',
                stringFilter: {
                  matchType: 'BEGINS_WITH' as const,
                  value: prefix,
                },
              },
            })),
          },
        }
      }
    }

    // Sessions + engagement (filtered by pagePath if product set)
    const sessionsResp = await ga4Client.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
        ],
        ...(pagePathFilter ? { dimensionFilter: pagePathFilter } : {}),
        ...(pagePathFilter ? { dimensions: [{ name: 'pagePath' }] } : {}),
      },
    })

    let sessions = 0
    let engagedSessions = 0
    if (pagePathFilter) {
      // Sum across all matching pages
      for (const row of sessionsResp.data.rows || []) {
        sessions += parseInt(row.metricValues?.[0]?.value || '0', 10)
        engagedSessions += parseInt(row.metricValues?.[1]?.value || '0', 10)
      }
    } else {
      sessions = parseInt(sessionsResp.data.rows?.[0]?.metricValues?.[0]?.value || '0', 10)
      engagedSessions = parseInt(sessionsResp.data.rows?.[0]?.metricValues?.[1]?.value || '0', 10)
    }

    // Events: view_pricing + begin_checkout (filter by pagePath if product set)
    const eventDimensions: Array<{ name: string }> = [{ name: 'eventName' }]
    if (pagePathFilter) eventDimensions.push({ name: 'pagePath' })

    const eventsFilter = pagePathFilter ? {
      andGroup: {
        expressions: [
          pagePathFilter,
          {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: ['view_pricing', 'pricing_view', 'view_item', 'begin_checkout', 'checkout_started'],
              },
            },
          },
        ],
      },
    } : {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: ['view_pricing', 'pricing_view', 'view_item', 'begin_checkout', 'checkout_started'],
        },
      },
    }

    const eventsResp = await ga4Client.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: eventDimensions,
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: eventsFilter,
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

    // Stripe purchases (filter by product if specified)
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
        if (c.status !== 'succeeded' || c.refunded) continue
        
        if (productFilter) {
          const product = detectStripeProduct(c.amount, c.metadata || {})
          if (product !== productFilter) continue
        }
        
        purchased++
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
    }

    return NextResponse.json({
      success: true,
      productFilter: productFilter || 'all',
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      funnel: [
        { stage: 'Sessions',          count: sessions,        label: 'Επισκέψεις' },
        { stage: 'Engaged',           count: engagedSessions, label: 'Engagement' },
        { stage: 'Viewed Pricing',    count: viewedPricing,   label: 'Είδαν τιμή' },
        { stage: 'Began Checkout',    count: beganCheckout,   label: 'Ξεκίνησαν checkout' },
        { stage: 'Purchased',         count: purchased,       label: 'Πληρωμή' },
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
