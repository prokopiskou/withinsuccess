import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'

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
      metadata: Record<string, string>
      payment_status: string
    }> = []

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
      })

      for (const s of batch.data) {
        if (s.payment_status === 'paid') {
          allSessions.push({
            id: s.id,
            amount_total: s.amount_total,
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
      unknownSales: 0,
      unknownRevenue: 0,
    }

    for (const session of allSessions) {
      const revenue = (session.amount_total || 0) / 100
      const meta = session.metadata
      const campaign = meta.utm_campaign || ''
      const source = meta.utm_source || ''
      const medium = meta.utm_medium || ''
      const content = meta.utm_content || '(no creative)'

      totals.totalSales++
      totals.totalRevenue += revenue

      // Classify: paid / organic / unknown
      const isPaid = medium === 'cpc' || medium === 'paid' || source === 'fb' || source === 'ig' || source === 'facebook' || source === 'instagram'
      const hasAnyAttribution = campaign || source

      if (!hasAnyAttribution) {
        totals.unknownSales++
        totals.unknownRevenue += revenue
      } else if (isPaid && medium === 'cpc') {
        totals.paidSales++
        totals.paidRevenue += revenue
      } else {
        totals.organicSales++
        totals.organicRevenue += revenue
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
