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

const BUCKET_LABELS: Record<Bucket, string> = {
  paid: 'Paid ads',
  organic: 'Organic',
  newsletter: 'Newsletter',
  unknown: 'Unknown',
}

const PRODUCT_LABELS: Record<string, string> = {
  '63days': '63 Μέρες',
  '30days': '30 Μέρες',
  'coaching': '1-on-1 Coaching',
  'other': 'Άλλο',
}

function detectProduct(amount: number, metadata: Record<string, string>): string {
  if (metadata.product === '63days') return '63days'
  if (metadata.product === '30days') return '30days'
  if (metadata.product === 'coaching') return 'coaching'
  const eur = amount / 100
  if (eur >= 65 && eur <= 119) return '63days'
  if (eur >= 13 && eur <= 19) return '30days'
  if (eur >= 120 && eur <= 500) return 'coaching'
  return 'other'
}

function classifyCharge(metadata: Record<string, string>): Bucket {
  const campaign = (metadata.utm_campaign || '').trim().toLowerCase()
  const source = (metadata.utm_source || '').trim().toLowerCase()
  const medium = (metadata.utm_medium || '').trim().toLowerCase()

  const hasAny = !!(campaign || source || medium)
  if (!hasAny) return 'unknown'

  const newsletter =
    medium === 'email' ||
    medium === 'newsletter' ||
    source === 'newsletter' ||
    source === 'mailerlite' ||
    source.includes('mailerlite') ||
    campaign.includes('newsletter')

  if (newsletter) return 'newsletter'

  const isPaid =
    medium === 'cpc' ||
    medium === 'paid' ||
    source === 'fb' ||
    source === 'ig' ||
    source === 'facebook' ||
    source === 'instagram'

  if (isPaid && medium === 'cpc') return 'paid'
  if (medium === 'paid') return 'paid'

  return 'organic'
}

type ProductBucket = {
  product: string
  label: string
  total: { sales: number; revenue: number }
  buckets: Record<Bucket, { sales: number; revenue: number }>
}

/**
 * GET /api/dashboard/source-breakdown?start=ISO&end=ISO
 *
 * Stripe charges grouped by acquisition bucket (paid / organic / newsletter / unknown)
 * and per-product × bucket matrix.
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

    const startTs = Math.floor(start.getTime() / 1000)
    const endTs = Math.floor(end.getTime() / 1000)

    const stripe = getStripeClient()

    const buckets: Record<Bucket, BucketStats> = {
      paid: { bucket: 'paid', label: BUCKET_LABELS.paid, sales: 0, revenue: 0 },
      organic: { bucket: 'organic', label: BUCKET_LABELS.organic, sales: 0, revenue: 0 },
      newsletter: {
        bucket: 'newsletter',
        label: BUCKET_LABELS.newsletter,
        sales: 0,
        revenue: 0,
      },
      unknown: { bucket: 'unknown', label: BUCKET_LABELS.unknown, sales: 0, revenue: 0 },
    }

    // Per-product × bucket matrix
    const productBucketMap: Record<string, ProductBucket> = {
      '63days': {
        product: '63days',
        label: PRODUCT_LABELS['63days'],
        total: { sales: 0, revenue: 0 },
        buckets: {
          paid: { sales: 0, revenue: 0 },
          organic: { sales: 0, revenue: 0 },
          newsletter: { sales: 0, revenue: 0 },
          unknown: { sales: 0, revenue: 0 },
        },
      },
      '30days': {
        product: '30days',
        label: PRODUCT_LABELS['30days'],
        total: { sales: 0, revenue: 0 },
        buckets: {
          paid: { sales: 0, revenue: 0 },
          organic: { sales: 0, revenue: 0 },
          newsletter: { sales: 0, revenue: 0 },
          unknown: { sales: 0, revenue: 0 },
        },
      },
      coaching: {
        product: 'coaching',
        label: PRODUCT_LABELS['coaching'],
        total: { sales: 0, revenue: 0 },
        buckets: {
          paid: { sales: 0, revenue: 0 },
          organic: { sales: 0, revenue: 0 },
          newsletter: { sales: 0, revenue: 0 },
          unknown: { sales: 0, revenue: 0 },
        },
      },
      other: {
        product: 'other',
        label: PRODUCT_LABELS['other'],
        total: { sales: 0, revenue: 0 },
        buckets: {
          paid: { sales: 0, revenue: 0 },
          organic: { sales: 0, revenue: 0 },
          newsletter: { sales: 0, revenue: 0 },
          unknown: { sales: 0, revenue: 0 },
        },
      },
    }

    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const batch = await stripe.charges.list({
        limit: 100,
        created: { gte: startTs, lte: endTs },
        starting_after: startingAfter,
      })

      for (const charge of batch.data) {
        if (charge.status !== 'succeeded' || charge.refunded) continue
        const meta = charge.metadata || {}
        const bucket = classifyCharge(meta)
        const amount = charge.amount / 100

        buckets[bucket].sales += 1
        buckets[bucket].revenue += amount

        const product = detectProduct(charge.amount, meta)
        const pb = productBucketMap[product]
        pb.total.sales += 1
        pb.total.revenue += amount
        pb.buckets[bucket].sales += 1
        pb.buckets[bucket].revenue += amount
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
    }

    const breakdown = (['paid', 'organic', 'newsletter', 'unknown'] as const).map((b) => buckets[b])

    const total = {
      sales: breakdown.reduce((s, x) => s + x.sales, 0),
      revenue: breakdown.reduce((s, x) => s + x.revenue, 0),
    }

    const products = Object.values(productBucketMap)
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
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
