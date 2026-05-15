import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'
import { classifySession, type SessionBucket } from '@/lib/dashboard/classifySession'

export const dynamic = 'force-dynamic'

type Bucket = SessionBucket

type BucketStats = {
  bucket: Bucket
  label: string
  sales: number
  revenue: number
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

    // Fetch all products once
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

    const buckets: Record<Bucket, BucketStats> = {
      paid:       { bucket: 'paid',       label: BUCKET_LABELS.paid,       sales: 0, revenue: 0 },
      organic:    { bucket: 'organic',    label: BUCKET_LABELS.organic,    sales: 0, revenue: 0 },
      newsletter: { bucket: 'newsletter', label: BUCKET_LABELS.newsletter, sales: 0, revenue: 0 },
      unknown:    { bucket: 'unknown',    label: BUCKET_LABELS.unknown,    sales: 0, revenue: 0 },
    }

    type ProductBucket = {
      productId: string
      label: string
      total: { sales: number; revenue: number }
      buckets: Record<Bucket, { sales: number; revenue: number }>
    }
    const productBucketMap = new Map<string, ProductBucket>()

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

        // UNIFIED RULE: 1 sale per session
        const grossCents = session.amount_total || 0
        const chargeId =
          typeof session.payment_intent === 'object' && session.payment_intent
            ? ((session.payment_intent as { latest_charge?: string | null }).latest_charge ??
              null)
            : null
        const feeCents = chargeId ? feeByChargeId.get(chargeId) || 0 : 0
        const sessionRevenue = (grossCents - feeCents) / 100 // NET in euros

        buckets[bucket].sales += 1
        buckets[bucket].revenue += sessionRevenue

        const lineItems = session.line_items?.data || []
        const productsInSession = new Set<string>()
        for (const item of lineItems) {
          const price = item.price
          if (!price) continue
          
          const productId = typeof price.product === 'string' 
            ? price.product 
            : (price.product?.id || '')
          
          const productName = productMap.get(productId) || `Product ${productId}` || '(unknown)'
          if (productsInSession.has(productName)) continue
          productsInSession.add(productName)
          
          const itemAmount = ((item.amount_total || price.unit_amount || 0) * (item.quantity || 1)) / 100

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
          pb.total.sales += 1
          pb.total.revenue += itemAmount
          pb.buckets[bucket].sales += 1
          pb.buckets[bucket].revenue += itemAmount
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
      truncated,
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
