import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'

export const dynamic = 'force-dynamic'

type Bucket = 'paid' | 'organic' | 'newsletter' | 'unknown'

type BucketStats = {
  bucket: Bucket
  label: string
  sales: number
  revenue: number
}

function classifyCharge(metadata: Record<string, string>): Bucket {
  const utm_medium = (metadata.utm_medium || '').toLowerCase()
  const utm_source = (metadata.utm_source || '').toLowerCase()
  const hasAnyUtm = !!(metadata.utm_campaign || metadata.utm_source || metadata.utm_medium)

  if (utm_medium === 'cpc' || utm_medium === 'paid') return 'paid'
  if ((utm_source === 'fb' || utm_source === 'facebook' || utm_source === 'ig' || utm_source === 'instagram') && utm_medium === 'cpc') return 'paid'
  
  if (utm_medium === 'email' || utm_medium === 'newsletter') return 'newsletter'
  if (utm_source === 'newsletter' || utm_source === 'mailerlite' || utm_source === 'email') return 'newsletter'

  if (hasAnyUtm) return 'organic'
  if (utm_source === 'instagram' || utm_source === 'ig' || utm_source === 'fb' || utm_source === 'facebook' || utm_source === 'tiktok' || utm_source === 'threads') return 'organic'

  return 'unknown'
}

const BUCKET_LABELS: Record<Bucket, string> = {
  paid: 'Paid Ads',
  organic: 'Organic',
  newsletter: 'Newsletter',
  unknown: 'Unknown',
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
    const buckets: Record<Bucket, BucketStats> = {
      paid:       { bucket: 'paid',       label: BUCKET_LABELS.paid,       sales: 0, revenue: 0 },
      organic:    { bucket: 'organic',    label: BUCKET_LABELS.organic,    sales: 0, revenue: 0 },
      newsletter: { bucket: 'newsletter', label: BUCKET_LABELS.newsletter, sales: 0, revenue: 0 },
      unknown:    { bucket: 'unknown',    label: BUCKET_LABELS.unknown,    sales: 0, revenue: 0 },
    }

    // Per-product × bucket matrix (dynamic from Stripe product names)
    type ProductBucket = {
      productId: string
      label: string
      total: { sales: number; revenue: number }
      buckets: Record<Bucket, { sales: number; revenue: number }>
    }
    const productBucketMap = new Map<string, ProductBucket>()

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
        const meta = session.metadata || {}
        const bucket = classifyCharge(meta)

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
          
          const itemAmount = ((item.amount_total || price.unit_amount || 0) * (item.quantity || 1)) / 100
          const itemSales = item.quantity || 1

          // Overall buckets
          buckets[bucket].sales += itemSales
          buckets[bucket].revenue += itemAmount

          // Per-product
          if (!productBucketMap.has(productName)) {
            productBucketMap.set(productName, {
              productId,
              label: productName,
              total: { sales: 0, revenue: 0 },
              buckets: {
                paid: { sales: 0, revenue: 0 },
                organic: { sales: 0, revenue: 0 },
                newsletter: { sales: 0, revenue: 0 },
                unknown: { sales: 0, revenue: 0 },
              },
            })
          }
          const pb = productBucketMap.get(productName)!
          pb.total.sales += itemSales
          pb.total.revenue += itemAmount
          pb.buckets[bucket].sales += itemSales
          pb.buckets[bucket].revenue += itemAmount
        }
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
    }

    const breakdown = Object.values(buckets)
    const total = breakdown.reduce((sum, b) => ({ 
      sales: sum.sales + b.sales, 
      revenue: sum.revenue + b.revenue 
    }), { sales: 0, revenue: 0 })

    const products = Array.from(productBucketMap.values())
      .filter((p) => p.total.sales > 0)
      .sort((a, b) => b.total.revenue - a.total.revenue)

    return NextResponse.json({
      success: true,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      buckets: breakdown,
      total,
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
