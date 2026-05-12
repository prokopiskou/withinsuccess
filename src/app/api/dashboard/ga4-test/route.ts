import { NextResponse } from 'next/server'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = getGA4Client()
    const propertyPath = getPropertyPath()

    const response = await client.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
        ],
      },
    })

    const metrics = response.data.rows?.[0]?.metricValues || []

    return NextResponse.json({
      success: true,
      data: {
        activeUsers: metrics[0]?.value || '0',
        sessions: metrics[1]?.value || '0',
        pageViews: metrics[2]?.value || '0',
        engagementRate: metrics[3]?.value || '0',
      },
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
