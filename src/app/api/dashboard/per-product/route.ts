import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'
import { fetchMetaInsights } from '@/lib/metaAdsClient'

export const dynamic = 'force-dynamic'

type ProductKey = '63days' | '30days' | 'coaching' | 'other'

type ProductStats = {
  product: ProductKey
  label: string
  price: number
  sales: number
  revenue: number
  adSpend: number
  cac: number
  roas: number
  margin: number
}

function detectProduct(amount: number, metadata: Record<string, string>): ProductKey {
  // First, trust metadata if set
  if (metadata.product === '63days') return '63days'
  if (metadata.product === '30days') return '30days'
  if (metadata.product === 'coaching') return 'coaching'

  // Fallback: infer from amount
  const eur = amount / 100
  if (eur >= 85 && eur <= 99) return '63days'   // €89
  if (eur >= 14 && eur <= 19) return '30days'   // €15
  if (eur >= 180 && eur <= 250) return 'coaching' // ~€200-240
  return 'other'
}

function matchCampaignToProduct(campaignName: string): ProductKey {
  const lower = campaignName.toLowerCase()
  if (lower.includes('63days') || lower.includes('63 days') || lower.includes('63 μερες') || lower.includes('63μερες') || lower.includes('sales 63') || lower.includes('63_')) return '63days'
  if (lower.includes('30days') || lower.includes('30 days') || lower.includes('30 μερες')) return '30days'
  if (lower.includes('coaching') || lower.includes('mentor')) return 'coaching'
  return 'other'
}

const PRODUCT_LABELS: Record<ProductKey, string> = {
  '63days': '63 Μέρες Ζωής',
  '30days': '30 Μέρες',
  'coaching': '1-on-1 Coaching',
  'other': 'Άλλο',
}

const PRODUCT_PRICES: Record<ProductKey, number> = {
  '63days': 89,
  '30days': 15,
  'coaching': 200,
  'other': 0,
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

    // STRIPE: aggregate revenue + sales per product
    const stripe = getStripeClient()
    const productStats: Record<ProductKey, ProductStats> = {
      '63days':   { product: '63days',   label: PRODUCT_LABELS['63days'],   price: PRODUCT_PRICES['63days'],   sales: 0, revenue: 0, adSpend: 0, cac: 0, roas: 0, margin: 0 },
      '30days':   { product: '30days',   label: PRODUCT_LABELS['30days'],   price: PRODUCT_PRICES['30days'],   sales: 0, revenue: 0, adSpend: 0, cac: 0, roas: 0, margin: 0 },
      'coaching': { product: 'coaching', label: PRODUCT_LABELS['coaching'], price: PRODUCT_PRICES['coaching'], sales: 0, revenue: 0, adSpend: 0, cac: 0, roas: 0, margin: 0 },
      'other':    { product: 'other',    label: PRODUCT_LABELS['other'],    price: 0,                          sales: 0, revenue: 0, adSpend: 0, cac: 0, roas: 0, margin: 0 },
    }

    // List all charges in range
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const batch = await stripe.charges.list({
        limit: 100,
        created: { gte: startTs, lte: endTs },
        starting_after: startingAfter,
        expand: ['data.payment_intent'],
      })

      for (const charge of batch.data) {
        if (charge.status !== 'succeeded' || charge.refunded) continue
        const meta = charge.metadata || {}
        const product = detectProduct(charge.amount, meta)
        productStats[product].sales += 1
        productStats[product].revenue += charge.amount / 100
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
    }

    // META: aggregate spend per campaign, match to products
    try {
      const since = toDate(start)
      const until = toDate(end)
      const metaResp = await fetchMetaInsights<MetaResponse>({ level: 'campaign', since, until })

      for (const row of metaResp.data || []) {
        const spend = parseFloat(row.spend || '0')
        const campaignName = row.campaign_name || ''
        const product = matchCampaignToProduct(campaignName)
        productStats[product].adSpend += spend
      }
    } catch (metaErr) {
      console.warn('Meta API failed in per-product:', metaErr)
      // Continue with Stripe-only data
    }

    // Calculate derived metrics
    const products = Object.values(productStats).map((p) => {
      p.cac = p.sales > 0 ? p.adSpend / p.sales : 0
      p.roas = p.adSpend > 0 ? p.revenue / p.adSpend : 0
      p.margin = p.revenue - p.adSpend
      return p
    })

    // Sort: products with sales/spend first, "other" last
    products.sort((a, b) => {
      if (a.product === 'other') return 1
      if (b.product === 'other') return -1
      return (b.revenue + b.adSpend) - (a.revenue + a.adSpend)
    })

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
