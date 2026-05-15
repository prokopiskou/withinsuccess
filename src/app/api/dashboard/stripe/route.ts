import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/stripe?start=2026-05-01&end=2026-05-12
 * 
 * Returns aggregated Stripe metrics for paid checkout sessions in the date range:
 * - Total revenue (€ net after Stripe fees)
 * - Number of successful payments (1 per paid session)
 * - Average order value
 * - Product breakdown (63days vs 30days)
 * - Recent payments list (last 20)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')

    // Default: last 30 days
    const end = endStr ? new Date(endStr) : new Date()
    const start = startStr
      ? new Date(startStr)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    const startTs = Math.floor(start.getTime() / 1000)
    const endTs = Math.floor(end.getTime() / 1000)

    const stripe = getStripeClient()

    type SessionRecord = {
      id: string
      amount: number
      grossAmount: number
      fee: number
      currency: string
      created: number
      description: string | null
      metadata: Record<string, string>
      receipt_email: string | null
      name: string | null
    }

    const charges: SessionRecord[] = []
    const MAX_PAGES = 30
    let pages = 0
    let truncated = false
    let hasMore = true
    let startingAfter: string | undefined

    const feeByChargeId = new Map<string, number>()
    try {
      let btCursor: string | undefined
      let btHasMore = true
      let btPages = 0
      while (btHasMore && btPages < MAX_PAGES) {
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
      console.warn('Failed to fetch balance transactions:', err)
    }

    while (hasMore && pages < MAX_PAGES) {
      const batch = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: startTs, lte: endTs },
        starting_after: startingAfter,
        expand: ['data.payment_intent'],
      })

      for (const session of batch.data) {
        if (session.payment_status !== 'paid') continue

        const grossCents = session.amount_total || 0
        const chargeId =
          typeof session.payment_intent === 'object' && session.payment_intent
            ? ((session.payment_intent as { latest_charge?: string | null }).latest_charge ??
              null)
            : null
        const feeCents = chargeId ? feeByChargeId.get(chargeId) || 0 : 0
        const netCents = grossCents - feeCents

        charges.push({
          id: session.id,
          amount: netCents / 100,
          grossAmount: grossCents / 100,
          fee: feeCents / 100,
          receipt_email: session.customer_details?.email ?? null,
          name: session.customer_details?.name ?? null,
          created: session.created,
          currency: session.currency || 'eur',
          description: null,
          metadata: session.metadata || {},
        })
      }

      hasMore = batch.has_more
      if (hasMore && batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
      pages++
    }

    if (hasMore && pages >= MAX_PAGES) {
      truncated = true
      console.warn(
        `[${req.nextUrl.pathname}] Pagination capped at ${MAX_PAGES} pages — data may be incomplete`
      )
    }

    // Aggregate (amount = NET euros)
    const totalGross = charges.reduce((sum, c) => sum + (c.grossAmount || c.amount), 0)
    const totalFees = charges.reduce((sum, c) => sum + (c.fee || 0), 0)
    const totalRevenue = charges.reduce((sum, c) => sum + c.amount, 0)
    const purchaseCount = charges.length
    const aov = purchaseCount > 0 ? totalRevenue / purchaseCount : 0

    // Product breakdown — match by gross amount (89€ = 63days, 15€ = 30days)
    const product63 = charges.filter((c) => c.grossAmount === 89)
    const product30 = charges.filter((c) => c.grossAmount === 15)
    const other = charges.filter((c) => c.grossAmount !== 89 && c.grossAmount !== 15)

    // Recent purchases (last 20, newest first)
    const recent = charges
      .sort((a, b) => b.created - a.created)
      .slice(0, 20)
      .map((c) => ({
        id: c.id,
        amount: c.amount,
        grossAmount: c.grossAmount,
        fee: c.fee,
        currency: c.currency,
        date: new Date(c.created * 1000).toISOString(),
        email: c.receipt_email,
        description: c.description,
        product:
          c.grossAmount === 89
            ? '63days'
            : c.grossAmount === 15
              ? '30days'
              : 'other',
      }))

    // Daily aggregation: group charges by date (NET revenue)
    const dailyMap = new Map<string, { revenue: number; count: number }>()

    charges.forEach((c) => {
      const date = new Date(c.created * 1000)
      const dateKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Athens',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date)

      const existing = dailyMap.get(dateKey) || { revenue: 0, count: 0 }
      dailyMap.set(dateKey, {
        revenue: existing.revenue + c.amount,
        count: existing.count + 1,
      })
    })

    // Fill in missing days with 0
    const dailyData: Array<{ date: string; revenue: number; count: number }> = []
    const dayMs = 24 * 60 * 60 * 1000
    const currentDay = new Date(start.getTime())
    while (currentDay <= end) {
      const dateKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Athens',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(currentDay)

      const dayData = dailyMap.get(dateKey) || { revenue: 0, count: 0 }
      dailyData.push({
        date: dateKey,
        revenue: Math.round(dayData.revenue * 100) / 100,
        count: dayData.count,
      })
      currentDay.setTime(currentDay.getTime() + dayMs)
    }

    return NextResponse.json({
      success: true,
      truncated,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        revenue: Math.round(totalRevenue * 100) / 100,
        grossRevenue: Math.round(totalGross * 100) / 100,
        stripeFees: Math.round(totalFees * 100) / 100,
        purchaseCount,
        aov: Math.round(aov * 100) / 100,
        currency: 'EUR',
      },
      breakdown: {
        '63days': {
          count: product63.length,
          revenue: Math.round(product63.reduce((s, c) => s + c.amount, 0) * 100) / 100,
        },
        '30days': {
          count: product30.length,
          revenue: Math.round(product30.reduce((s, c) => s + c.amount, 0) * 100) / 100,
        },
        other: {
          count: other.length,
          revenue: Math.round(other.reduce((s, c) => s + c.amount, 0) * 100) / 100,
        },
      },
      daily: dailyData,
      recent,
    })
  } catch (err) {
    const e = err as Error
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    )
  }
}
