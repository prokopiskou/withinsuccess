import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripeClient'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/stripe?start=2026-05-01&end=2026-05-12
 * 
 * Returns aggregated Stripe metrics for the date range:
 * - Total revenue (€)
 * - Number of successful payments
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

    // Fetch all successful charges in date range
    // Paginate through all results
    type Charge = {
      id: string
      amount: number
      currency: string
      created: number
      status: string
      description: string | null
      metadata: Record<string, string>
      receipt_email: string | null
      payment_method_details: { type: string } | null
    }

    const charges: Charge[] = []
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore && charges.length < 1000) {
      const batch = await stripe.charges.list({
        limit: 100,
        created: { gte: startTs, lte: endTs },
        starting_after: startingAfter,
      })

      for (const c of batch.data) {
        if (c.status === 'succeeded' && !c.refunded) {
          charges.push({
            id: c.id,
            amount: c.amount,
            currency: c.currency,
            created: c.created,
            status: c.status,
            description: c.description,
            metadata: c.metadata,
            receipt_email: c.receipt_email,
            payment_method_details: c.payment_method_details
              ? { type: c.payment_method_details.type }
              : null,
          })
        }
      }

      hasMore = batch.has_more
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id
      }
    }

    // Aggregate
    const totalRevenue = charges.reduce((sum, c) => sum + c.amount, 0) / 100
    const purchaseCount = charges.length
    const aov = purchaseCount > 0 ? totalRevenue / purchaseCount : 0

    // Product breakdown — match by amount (89€ = 63days, 15€ = 30days)
    const product63 = charges.filter((c) => c.amount === 8900)
    const product30 = charges.filter((c) => c.amount === 1500)
    const other = charges.filter((c) => c.amount !== 8900 && c.amount !== 1500)

    // Recent purchases (last 20, newest first)
    const recent = charges
      .sort((a, b) => b.created - a.created)
      .slice(0, 20)
      .map((c) => ({
        id: c.id,
        amount: c.amount / 100,
        currency: c.currency,
        date: new Date(c.created * 1000).toISOString(),
        email: c.receipt_email,
        description: c.description,
        product:
          c.amount === 8900
            ? '63days'
            : c.amount === 1500
            ? '30days'
            : 'other',
      }))

    return NextResponse.json({
      success: true,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        purchaseCount,
        aov: Math.round(aov * 100) / 100,
        currency: 'EUR',
      },
      breakdown: {
        '63days': {
          count: product63.length,
          revenue: product63.reduce((s, c) => s + c.amount, 0) / 100,
        },
        '30days': {
          count: product30.length,
          revenue: product30.reduce((s, c) => s + c.amount, 0) / 100,
        },
        other: {
          count: other.length,
          revenue: other.reduce((s, c) => s + c.amount, 0) / 100,
        },
      },
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
