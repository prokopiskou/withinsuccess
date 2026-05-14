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
 * GET /api/dashboard/content?start=ISO&end=ISO
 *
 * Returns top pages by page views:
 * - pagePath
 * - pageTitle
 * - views
 * - users
 * - avgEngagementTime (seconds)
 * - bounceRate
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

    const startDate = toGA4Date(start)
    const endDate = toGA4Date(end)

    const client = getGA4Client()
    const propertyPath = getPropertyPath()

    const response = await client.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'totalUsers' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        orderBys: [
          {
            metric: { metricName: 'screenPageViews' },
            desc: true,
          },
        ],
        limit: '20',
      },
    })

    type PageRow = {
      pagePath: string
      pageTitle: string
      views: number
      users: number
      avgEngagementTime: number
      bounceRate: number
    }

    const rows: PageRow[] = (response.data.rows || []).map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || '/',
      pageTitle: row.dimensionValues?.[1]?.value || '(no title)',
      views: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10),
      avgEngagementTime: parseFloat(row.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[3]?.value || '0'),
    }))

    // Filter out admin/api paths
    const filtered = rows.filter(
      (r) =>
        !r.pagePath.startsWith('/api/') &&
        !r.pagePath.startsWith('/dashboard') &&
        !r.pagePath.startsWith('/insta-dashboard')
    )

    return NextResponse.json({
      success: true,
      dateRange: { startDate, endDate },
      pages: filtered,
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
