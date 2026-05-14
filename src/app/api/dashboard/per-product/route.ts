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

// Match campaign name to product (using keyword matching)
function matchCampaignToProduct(campaignName: string, productNames: string[]): string | null {
  const lower = campaignName.toLowerCase()
  
  for (const productName of productNames) {
    const pLower = productName.toLowerCase()
    // Match if campaign contains words from product name
    const words = pLower.split(/\s+/).filter(w => w.length >= 3)
    for (const word of words) {
      if (lower.includes(word)) return productName
    }
  }
  
  // Hard-coded fallbacks for common patterns
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

    // Fetch all completed sessions in range with expanded line_items
    const productStats = new Map<string, ProductStats>()

    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const batch = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: startTs, lte: endTs },
        starting_after: startingAfter,
        expand: ['data.line_items', 'data.line_items.data.price.product'],
      })

      for (const session of batch.data) {
        if (session.payment_status !== 'paid') continue
        
        const lineItems = session.line_items?.data || []
        
        for (const item of lineItems) {
          const price = item.price
          if (!price) continue
          
          const product = price.product
          let productId = ''
          let productName = '(unknown)'
          
          if (typeof product === 'string') {
            productId = product
            productName = `Product ${product}`
          } else if (product && typeof product === 'object' && 'name' in product) {
            productId = product.id
            productName = product.name || `Product ${product.id}`
          }
          
          if (!productStats.has(productName)) {
            productStats.set(productName, {
              productId,
              label: productName,
              price: (price.unit_amount || 0) / 100,
              sales: 0,
              revenue: 0,
              adSpend: 0,
              cac: 0,
              roas: 0,
              margin: 0,
            })
          }
          
          const stats = productStats.get(productName)!
          const itemAmount = ((item.amount_total || price.unit_amount || 0) * (item.quantity || 1)) / 100
          stats.sales += (item.quantity || 1)
          stats.revenue += itemAmount
        }
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
    }

    // Now try to attribute Meta spend to products by campaign name matching
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

    // Calculate derived metrics + handle dynamic pricing (AOV for variable products)
    const products = Array.from(productStats.values()).map((p) => {
      p.cac = p.sales > 0 ? p.adSpend / p.sales : 0
      p.roas = p.adSpend > 0 ? p.revenue / p.adSpend : 0
      p.margin = p.revenue - p.adSpend
      
      // Calculate actual AOV (in case of variable pricing or quantity > 1)
      if (p.sales > 0) {
        p.price = p.revenue / p.sales
      }
      
      return p
    })

    // Sort by revenue
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
