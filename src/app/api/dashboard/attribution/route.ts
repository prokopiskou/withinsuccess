import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'
import { classifySession } from '@/lib/dashboard/classifySession'

export const dynamic = 'force-dynamic'

type CampaignBreakdown = {
  campaign: string
  source: string
  ads: Array<{
    content: string
    sales: number
    revenue: number
  }>
  sales: number
  revenue: number
}

type AttributionTotals = {
  totalSales: number
  totalRevenue: number
  paidSales: number
  paidRevenue: number
  organicSales: number
  organicRevenue: number
  newsletterSales: number
  newsletterRevenue: number
  unknownSales: number
  unknownRevenue: number
}

/**
 * GET /api/dashboard/attribution?start=ISO&end=ISO
 * 
 * Reads Stripe Checkout Sessions in date range, groups by UTM metadata.
 * Returns campaign-level and ad-level breakdown.
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

    // Fetch all completed checkout sessions in date range (paginate)
    const allSessions: Array<{
      id: string
      amount_total: number | null
      chargeId: string | null
      metadata: Record<string, string>
      payment_status: string
    }> = []

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
        expand: ['data.payment_intent'],
      })

      for (const s of batch.data) {
        if (s.payment_status === 'paid') {
          const chargeId =
            typeof s.payment_intent === 'object' && s.payment_intent
              ? ((s.payment_intent as { latest_charge?: string | null }).latest_charge ??
                null)
              : null
          allSessions.push({
            id: s.id,
            amount_total: s.amount_total,
            chargeId,
            metadata: s.metadata || {},
            payment_status: s.payment_status,
          })
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

    // Group by campaign
    const campaignMap = new Map<string, CampaignBreakdown>()
    const totals: AttributionTotals = {
      totalSales: 0,
      totalRevenue: 0,
      paidSales: 0,
      paidRevenue: 0,
      organicSales: 0,
      organicRevenue: 0,
      newsletterSales: 0,
      newsletterRevenue: 0,
      unknownSales: 0,
      unknownRevenue: 0,
    }

    for (const session of allSessions) {
      const grossCents = session.amount_total || 0
      const feeCents = session.chargeId ? feeByChargeId.get(session.chargeId) || 0 : 0
      const revenue = (grossCents - feeCents) / 100 // NET in euros
      const meta = session.metadata
      const campaign = meta.utm_campaign || ''
      const source = meta.utm_source || ''
      const medium = meta.utm_medium || ''
      const content = meta.utm_content || '(no creative)'

      totals.totalSales++
      totals.totalRevenue += revenue

      const bucket = classifySession(meta)

      if (bucket === 'paid') {
        totals.paidSales++
        totals.paidRevenue += revenue
      } else if (bucket === 'organic') {
        totals.organicSales++
        totals.organicRevenue += revenue
      } else if (bucket === 'newsletter') {
        totals.newsletterSales++
        totals.newsletterRevenue += revenue
      } else {
        totals.unknownSales++
        totals.unknownRevenue += revenue
      }

      // Aggregate by campaign
      const campaignKey = campaign || `(${source || 'unknown'})`
      
      if (!campaignMap.has(campaignKey)) {
        campaignMap.set(campaignKey, {
          campaign: campaignKey,
          source: source || '—',
          ads: [],
          sales: 0,
          revenue: 0,
        })
      }
      const cb = campaignMap.get(campaignKey)!
      cb.sales++
      cb.revenue += revenue

      const existingAd = cb.ads.find((a) => a.content === content)
      if (existingAd) {
        existingAd.sales++
        existingAd.revenue += revenue
      } else {
        cb.ads.push({ content, sales: 1, revenue })
      }
    }

    const campaigns = Array.from(campaignMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((c) => ({
        ...c,
        ads: c.ads.sort((a, b) => b.revenue - a.revenue),
      }))

    return NextResponse.json({
      success: true,
      truncated,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      totals,
      campaigns,
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
