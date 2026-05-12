import { NextResponse } from 'next/server'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = getGA4Client()
    const propertyPath = getPropertyPath()

    const [response] = await client.runReport({
      property: propertyPath,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'engagementRate' },
      ],
    })

    const metrics = response.rows?.[0]?.metricValues || []

    return NextResponse.json({
      success: true,
      data: {
        activeUsers: metrics[0]?.value || '0',
        sessions: metrics[1]?.value || '0',
        pageViews: metrics[2]?.value || '0',
        engagementRate: metrics[3]?.value || '0',
      },
      propertyPath,
      rowCount: response.rowCount || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    // Capture every possible field of the error for debugging
    const errorObj: Record<string, unknown> = {}

    if (err && typeof err === 'object') {
      // Get all enumerable + own properties
      const allProps = [
        ...Object.getOwnPropertyNames(err),
        ...Object.keys(err),
      ]
      for (const key of new Set(allProps)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorObj[key] = (err as any)[key]
        } catch {
          errorObj[key] = '<unable to read>'
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error_type: err?.constructor?.name || typeof err,
        error_string: String(err),
        error_message: err instanceof Error ? err.message : 'not an Error instance',
        error_object: errorObj,
        propertyPath: process.env.GA4_PROPERTY_ID || 'MISSING',
      },
      { status: 500 }
    )
  }
}
