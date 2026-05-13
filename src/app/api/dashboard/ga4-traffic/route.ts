import { NextRequest, NextResponse } from 'next/server'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'

export const dynamic = 'force-dynamic'

function toGA4Date(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * GET /api/dashboard/ga4-traffic?start=ISO&end=ISO
 * 
 * Returns top traffic sources by sessions with conversion data:
 * - source/medium combinations
 * - sessions, users, purchases, revenue per source
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')

    const end = endStr ? new Date(endStr) : new Date()
    const start = startStr
      ? new Date(startStr)
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)

    const startDate = toGA4Date(start)
    const endDate = toGA4Date(end)

    const client = getGA4Client()
    const propertyPath = getPropertyPath()

    const response = await client.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'transactions' },
          { name: 'purchaseRevenue' },
        ],
        orderBys: [
          {
            metric: { metricName: 'sessions' },
            desc: true,
          },
        ],
        limit: '15',
      },
    })

    type SourceRow = {
      sourceMedium: string
      source: string
      medium: string
      sessions: number
      users: number
      transactions: number
      revenue: number
    }

    const rows: SourceRow[] = (response.data.rows || []).map((row) => {
      const sourceMedium = row.dimensionValues?.[0]?.value || '(unknown)'
      const [source = '(direct)', medium = '(none)'] = sourceMedium.split(' / ')
      
      return {
        sourceMedium,
        source,
        medium,
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row.metricValues?.[1]?.value || '0', 10),
        transactions: parseInt(row.metricValues?.[2]?.value || '0', 10),
        revenue: parseFloat(row.metricValues?.[3]?.value || '0'),
      }
    })

    // Total session count for % calculation
    const totalSessions = rows.reduce((sum, r) => sum + r.sessions, 0)

    const rowsWithPercent = rows.map((r) => ({
      ...r,
      sessionsPercent: totalSessions > 0 ? (r.sessions / totalSessions) * 100 : 0,
      conversionRate: r.sessions > 0 ? (r.transactions / r.sessions) * 100 : 0,
    }))

    return NextResponse.json({
      success: true,
      dateRange: { startDate, endDate },
      totalSessions,
      sources: rowsWithPercent,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any
    return NextResponse.json(
      {
        success: false,
        error_message: e?.message || String(err),
      },
      { status: 500 }
    )
  }
}
