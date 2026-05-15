import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'

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

function classifyOrganicSource(source: string, medium: string, campaign: string = ''): OrganicCategory | null {
  const s = source.toLowerCase()
  const m = medium.toLowerCase()
  const c = campaign.toLowerCase()
  
  if (m === 'cpc' || m === 'paid') return null
  if (m === 'email' || m === 'newsletter' || s === 'newsletter' || s === 'mailerlite') return null
  
  if (s === 'manychat' || c.includes('manychat')) {
    if (m === 'fb' || c.includes('fb') || c.includes('facebook')) return 'fb_manychat'
    return 'ig_manychat'
  }
  
  if (s === 'instagram' || s === 'ig' || s === 'instagram.com' || s === 'l.instagram.com') {
    if (m === 'story' || m === 'stories') return 'ig_stories'
    return 'ig_bio'
  }
  
  if (s === 'facebook' || s === 'fb' || s === 'facebook.com' || s === 'm.facebook.com' || s === 'l.facebook.com') {
    if (m === 'story' || m === 'stories') return 'fb_stories'
    return 'fb_bio'
  }
  
  if (s === 'tiktok' || s === 'tt' || s === 'tiktok.com') return 'tiktok_bio'
  if (s === 'threads' || s === 'th' || s === 'threads.net') return 'threads_bio'
  
  if (s === 'google' && (m === 'organic' || m === '' || m === 'referral')) return 'google_organic'
  
  if (!s && !m && !c) return 'direct'
  if (s === '(direct)' || s === 'direct' || s === '(none)') return 'direct'
  
  return 'other_organic'
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

        const category = classifyOrganicSource(source, medium, campaign)
        if (!category) continue
        
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
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const batch = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: startTs, lte: endTs },
        starting_after: startingAfter,
        expand: ['data.line_items'],
      })

      for (const session of batch.data) {
        if (session.payment_status !== 'paid') continue
        const meta = session.metadata || {}
        const category = classifyOrganicSource(
          meta.utm_source || '',
          meta.utm_medium || '',
          meta.utm_campaign || ''
        )
        if (!category) continue

        const lineItems = session.line_items?.data || []
        for (const item of lineItems) {
          const price = item.price
          if (!price) continue

          const productId = typeof price.product === 'string' 
            ? price.product 
            : (price.product?.id || '')
          const productName = productMap.get(productId) || `Product ${productId}`
          const itemAmount = ((item.amount_total || price.unit_amount || 0) * (item.quantity || 1)) / 100
          const itemSales = item.quantity || 1

          categories[category].sales += itemSales
          categories[category].revenue += itemAmount

          const productsMap = productsPerCategory[category]
          if (!productsMap.has(productName)) {
            productsMap.set(productName, { sales: 0, revenue: 0 })
          }
          const p = productsMap.get(productName)!
          p.sales += itemSales
          p.revenue += itemAmount
        }
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
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
