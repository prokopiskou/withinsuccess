import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'
import { fetchMetaInsights } from '@/lib/metaAdsClient'

export const dynamic = 'force-dynamic'

type ProductStats = {
  productId: string
  label: string
  price: number
  sales: number
  revenue: number
  adSpend: number
  cac: number
  roas: number
  margin: number
}

type MetaInsightRow = {
  spend?: string
  campaign_name?: string
}

type MetaResponse = {
  data: MetaInsightRow[]
}

function toDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function matchCampaignToProduct(campaignName: string, productNames: string[]): string | null {
  const lower = campaignName.toLowerCase()
  
  for (const productName of productNames) {
    const pLower = productName.toLowerCase()
    const words = pLower.split(/\s+/).filter(w => w.length >= 3)
    for (const word of words) {
      if (lower.includes(word)) return productName
    }
  }
  
  if (lower.includes('63days') || lower.includes('63 days') || lower.includes('63 μερες') || lower.includes('sales 63')) {
    return productNames.find(n => n.toLowerCase().includes('63') || n.toLowerCase().includes('μερες')) || null
  }
  if (lower.includes('coaching') || lower.includes('mentor') || lower.includes('1-1') || lower.includes('1on1')) {
    return productNames.find(n => n.toLowerCase().includes('coaching') || n.toLowerCase().includes('συνεδρ') || n.toLowerCase().includes('1-1')) || null
  }
  
  return null
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

    const stripe = getStripeClient()

    // STEP 1: Fetch all Stripe products once, build map productId → name
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

    // STEP 2: List sessions with line_items expanded (within 4-level limit)
    const productStats = new Map<string, ProductStats>()

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

        // ONLY include paid-ad attributed sessions
        const meta = session.metadata || {}
        const utm_medium = (meta.utm_medium || '').toLowerCase()
        const utm_source = (meta.utm_source || '').toLowerCase()

        const isPaid =
          utm_medium === 'cpc' ||
          utm_medium === 'paid' ||
          ((utm_source === 'fb' ||
            utm_source === 'facebook' ||
            utm_source === 'ig' ||
            utm_source === 'instagram') &&
            utm_medium === 'cpc')

        if (!isPaid) continue

        const lineItems = session.line_items?.data || []

        // Aggregate revenue per product in this session; sales = 1 per product per session
        const sessionByProduct = new Map<
          string,
          { productId: string; revenue: number; unitPrice: number }
        >()

        for (const item of lineItems) {
          const price = item.price
          if (!price) continue

          const productId =
            typeof price.product === 'string'
              ? price.product
              : price.product?.id || ''

          const productName =
            productMap.get(productId) || `Product ${productId}` || '(unknown)'
          const itemAmount =
            ((item.amount_total || price.unit_amount || 0) * (item.quantity || 1)) / 100
          const unitPrice = (price.unit_amount || 0) / 100

          const prev = sessionByProduct.get(productName)
          if (prev) {
            prev.revenue += itemAmount
          } else {
            sessionByProduct.set(productName, {
              productId,
              revenue: itemAmount,
              unitPrice,
            })
          }
        }

        for (const [productName, acc] of sessionByProduct) {
          if (!productStats.has(productName)) {
            productStats.set(productName, {
              productId: acc.productId,
              label: productName,
              price: acc.unitPrice,
              sales: 0,
              revenue: 0,
              adSpend: 0,
              cac: 0,
              roas: 0,
              margin: 0,
            })
          }

          const stats = productStats.get(productName)!
          stats.sales += 1
          stats.revenue += acc.revenue
        }
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
    }

    // STEP 3: Match Meta spend to products
    try {
      const since = toDate(start)
      const until = toDate(end)
      const metaResp = await fetchMetaInsights<MetaResponse>({ level: 'campaign', since, until })

      const productNames = Array.from(productStats.keys())

      for (const row of metaResp.data || []) {
        const spend = parseFloat(row.spend || '0')
        const campaignName = row.campaign_name || ''
        const matchedProduct = matchCampaignToProduct(campaignName, productNames)
        
        if (matchedProduct && productStats.has(matchedProduct)) {
          productStats.get(matchedProduct)!.adSpend += spend
        }
      }
    } catch (metaErr) {
      console.warn('Meta API failed in per-product:', metaErr)
    }

    const products = Array.from(productStats.values()).map((p) => {
      p.cac = p.sales > 0 ? p.adSpend / p.sales : 0
      p.roas = p.adSpend > 0 ? p.revenue / p.adSpend : 0
      p.margin = p.revenue - p.adSpend
      
      if (p.sales > 0) {
        p.price = p.revenue / p.sales
      }
      
      return p
    })

    products.sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({
      success: true,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      products,
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
