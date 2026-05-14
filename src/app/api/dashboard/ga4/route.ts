import { NextRequest, NextResponse } from 'next/server'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'

export const dynamic = 'force-dynamic'

/**
 * Format Date object to YYYY-MM-DD in Europe/Athens timezone.
 * GA4 property is in Athens TZ — server may be UTC.
 * Without this, requests near midnight Athens could return wrong date.
 */
function toGA4Date(d: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(d) // Returns "YYYY-MM-DD"
}

/**
 * GET /api/dashboard/ga4?start=ISO&end=ISO
 *
 * Returns GA4 metrics for the date range.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')

    // Default: last 7 days
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
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
        ],
      },
    })

    const metrics = response.data.rows?.[0]?.metricValues || []

    // Daily breakdown query
    const dailyResponse = await client.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
        orderBys: [
          {
            dimension: { dimensionName: 'date' },
            desc: false,
          },
        ],
      },
    })

    const dailyData: Array<{
      date: string
      sessions: number
      users: number
      pageViews: number
    }> = (dailyResponse.data.rows || []).map((row) => {
      const dateStr = row.dimensionValues?.[0]?.value || ''
      // GA4 returns date as YYYYMMDD, convert to YYYY-MM-DD
      const formatted =
        dateStr.length === 8
          ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
          : dateStr

      return {
        date: formatted,
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
        users: parseInt(row.metricValues?.[1]?.value || '0', 10),
        pageViews: parseInt(row.metricValues?.[2]?.value || '0', 10),
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        activeUsers: metrics[0]?.value || '0',
        sessions: metrics[1]?.value || '0',
        pageViews: metrics[2]?.value || '0',
        engagementRate: metrics[3]?.value || '0',
      },
      daily: dailyData,
      dateRange: { startDate, endDate },
      propertyPath,
      rowCount: response.data.rowCount || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any
    return NextResponse.json(
      {
        success: false,
        error_type: e?.constructor?.name || typeof err,
        error_message: e?.message || String(err),
        error_code: e?.code,
        error_response: e?.response?.data,
        error_status: e?.response?.status,
      },
      { status: 500 }
    )
  }
}
