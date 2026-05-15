import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'
import { classifySession, classifyOrganicSubSource } from '@/lib/dashboard/classifySession'

export const dynamic = 'force-dynamic'

type OrganicCategory = 
  | 'ig_bio' | 'ig_stories' | 'ig_manychat'
  | 'fb_bio' | 'fb_stories' | 'fb_manychat'
  | 'tiktok_bio' | 'threads_bio'
  | 'google_organic' | 'other_organic' | 'direct'

const CATEGORY_LABELS: Record<OrganicCategory, string> = {
  ig_bio:       'Instagram Bio',
  ig_stories:   'Instagram Stories',
  ig_manychat:  'Instagram ManyChat',
  fb_bio:       'Facebook Bio',
  fb_stories:   'Facebook Stories',
  fb_manychat:  'Facebook ManyChat',
  tiktok_bio:   'TikTok Bio',
  threads_bio:  'Threads Bio',
  google_organic: 'Google Organic',
  other_organic: 'Άλλο Organic',
  direct:       'Direct (no UTM)',
}

type CategoryStats = {
  category: OrganicCategory
  label: string
  visits: number
  sales: number
  revenue: number
  conversionRate: number
  products: Array<{ name: string; sales: number; revenue: number }>
}

function toGA4Date(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')

    const end = endStr ? new Date(endStr) : new Date()
    const start = startStr
      ? new Date(startStr)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    const startTs = Math.floor(start.getTime() / 1000)
    const endTs = Math.floor(end.getTime() / 1000)
    const ga4StartDate = toGA4Date(start)
    const ga4EndDate = toGA4Date(end)

    const stripe = getStripeClient()
    const ga4Client = getGA4Client()
    const propertyPath = getPropertyPath()

    // Init category stats
    const categories: Record<string, CategoryStats> = {}
    Object.entries(CATEGORY_LABELS).forEach(([key, label]) => {
      categories[key] = {
        category: key as OrganicCategory,
        label,
        visits: 0,
        sales: 0,
        revenue: 0,
        conversionRate: 0,
        products: [],
      }
    })
    const productsPerCategory: Record<string, Map<string, { sales: number; revenue: number }>> = {}
    Object.keys(categories).forEach((k) => { productsPerCategory[k] = new Map() })

    // STEP 1: GA4 sessions per source/medium
    try {
      const ga4Resp = await ga4Client.properties.runReport({
        property: propertyPath,
        requestBody: {
          dateRanges: [{ startDate: ga4StartDate, endDate: ga4EndDate }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' },
          ],
          metrics: [{ name: 'sessions' }],
          limit: '1000',
        },
      })

      for (const row of ga4Resp.data.rows || []) {
        const source = row.dimensionValues?.[0]?.value || ''
        const medium = row.dimensionValues?.[1]?.value || ''
        const campaign = row.dimensionValues?.[2]?.value || ''
        const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10)

        const meta = {
          utm_source: source,
          utm_medium: medium,
          utm_campaign: campaign,
        }
        const bucket = classifySession(meta)
        if (bucket !== 'organic' && bucket !== 'unknown') continue

        const category: OrganicCategory =
          bucket === 'unknown' ? 'direct' : classifyOrganicSubSource(meta)

        categories[category].visits += sessions
      }
    } catch (ga4Err) {
      console.warn('GA4 organic query failed:', ga4Err)
    }

    // STEP 2: Stripe products map
    const productMap = new Map<string, string>()
    let productHasMore = true
    let productStartingAfter: string | undefined
    while (productHasMore) {
      const batch = await stripe.products.list({
        limit: 100,
        starting_after: productStartingAfter,
      })
      for (const p of batch.data) {
        productMap.set(p.id, p.name || `Product ${p.id}`)
      }
      productHasMore = batch.has_more
      if (batch.data.length > 0) {
        productStartingAfter = batch.data[batch.data.length - 1].id
      }
    }

    // STEP 3: Stripe sales per organic category
    const feeByChargeId = new Map<string, number>()
    try {
      let btCursor: string | undefined
      let btHasMore = true
      let btPages = 0
      while (btHasMore && btPages < 30) {
        const btBatch = await stripe.balanceTransactions.list({
          limit: 100,
          created: { gte: startTs, lte: endTs },
          type: 'charge',
          starting_after: btCursor,
        })
        for (const bt of btBatch.data) {
          if (bt.source && typeof bt.source === 'string') {
            feeByChargeId.set(bt.source, bt.fee || 0)
          }
        }
        btHasMore = btBatch.has_more
        if (btHasMore && btBatch.data.length > 0) {
          btCursor = btBatch.data[btBatch.data.length - 1].id
        }
        btPages++
      }
    } catch (err) {
      console.warn('Failed to fetch balance transactions for fees:', err)
    }

    const MAX_PAGES = 30 // ~3000 sessions max per request
    let pages = 0
    let truncated = false
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore && pages < MAX_PAGES) {
      const batch = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: startTs, lte: endTs },
        starting_after: startingAfter,
        expand: ['data.payment_intent', 'data.line_items.data.price'],
      })

      for (const session of batch.data) {
        if (session.payment_status !== 'paid') continue
        const meta = session.metadata || {}
        const bucket = classifySession(meta)
        if (bucket !== 'organic' && bucket !== 'unknown') continue

        const category: OrganicCategory =
          bucket === 'unknown' ? 'direct' : classifyOrganicSubSource(meta)

        // UNIFIED RULE: 1 sale = 1 paid checkout session
        const grossCents = session.amount_total || 0
        const chargeId =
          typeof session.payment_intent === 'object' && session.payment_intent
            ? ((session.payment_intent as { latest_charge?: string | null }).latest_charge ??
              null)
            : null
        const feeCents = chargeId ? feeByChargeId.get(chargeId) || 0 : 0
        const sessionRevenue = (grossCents - feeCents) / 100 // NET in euros
        categories[category].sales += 1
        categories[category].revenue += sessionRevenue

        // Track products for breakdown (sale count per product = 1 per session per product)
        const lineItems = session.line_items?.data || []
        const productsMap = productsPerCategory[category]
        const productsInSession = new Set<string>()
        
        for (const item of lineItems) {
          const price = item.price
          if (!price) continue
          const productId = typeof price.product === 'string' 
            ? price.product 
            : (price.product?.id || '')
          const productName = productMap.get(productId) || `Product ${productId}`
          if (productsInSession.has(productName)) continue
          productsInSession.add(productName)
          
          const itemAmount = ((item.amount_total || price.unit_amount || 0) * (item.quantity || 1)) / 100
          if (!productsMap.has(productName)) {
            productsMap.set(productName, { sales: 0, revenue: 0 })
          }
          const p = productsMap.get(productName)!
          p.sales += 1
          p.revenue += itemAmount
        }
      }

      hasMore = batch.has_more
      if (hasMore && batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
      pages++
    }

    if (hasMore && pages >= MAX_PAGES) {
      truncated = true
      console.warn(`[${req.nextUrl.pathname}] Pagination capped at ${MAX_PAGES} pages — data may be incomplete`)
    }

    // STEP 4: Calculate conversion rates + finalize
    const categoryList = Object.values(categories).map((c) => {
      c.conversionRate = c.visits > 0 ? (c.sales / c.visits) * 100 : 0
      const productsMap = productsPerCategory[c.category]
      c.products = Array.from(productsMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
      return c
    })

    // Sort: by visits desc (we want to see what brings traffic)
    categoryList.sort((a, b) => b.visits - a.visits)

    // Only include categories with visits OR sales
    const filtered = categoryList.filter((c) => c.visits > 0 || c.sales > 0)

    const totals = filtered.reduce(
      (sum, c) => ({ 
        visits: sum.visits + c.visits, 
        sales: sum.sales + c.sales, 
        revenue: sum.revenue + c.revenue 
      }),
      { visits: 0, sales: 0, revenue: 0 }
    )
    const overallConv = totals.visits > 0 ? (totals.sales / totals.visits) * 100 : 0

    return NextResponse.json({
      success: true,
      truncated,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      totals: { ...totals, conversionRate: overallConv },
      categories: filtered,
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
