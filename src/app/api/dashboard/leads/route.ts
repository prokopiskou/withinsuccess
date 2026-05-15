import { NextRequest, NextResponse } from 'next/server'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'
import { getCached, setCached } from '@/lib/dashboard/cache'

export const dynamic = 'force-dynamic'

const GROUPS = {
  coaching: '184997659389461878',
  program_waitlist: '187457343070405693',  // 63 Days waitlist
  seminar_waitlist: '187522640873784777',
}

function toDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

async function countSubscribersInGroup(
  groupId: string,
  apiKey: string,
  start: Date,
  end: Date
): Promise<number> {
  let count = 0
  let cursor: string | undefined
  let hasMore = true
  const maxPages = 50  // safety
  let pages = 0

  while (hasMore && pages < maxPages) {
    const url = new URL('https://connect.mailerlite.com/api/subscribers')
    url.searchParams.set('filter[status]', 'active')
    url.searchParams.set('filter[group]', groupId)
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    })
    if (!res.ok) {
      console.error('MailerLite group fetch failed', groupId, res.status)
      break
    }
    const data = await res.json()
    const subscribers = data.data || []

    for (const sub of subscribers) {
      const createdAt = sub.subscribed_at || sub.created_at
      if (!createdAt) continue
      const subDate = new Date(createdAt)
      if (subDate >= start && subDate <= end) {
        count++
      }
    }

    cursor = data?.meta?.next_cursor || data?.links?.next || undefined
    hasMore = !!cursor && subscribers.length === 100
    pages++
  }

  return count
}

async function getQuizLeads(start: Date, end: Date): Promise<number> {
  try {
    const ga4 = getGA4Client()
    const propertyPath = getPropertyPath()
    const resp = await ga4.properties.runReport({
      property: propertyPath,
      requestBody: {
        dateRanges: [{ startDate: toDate(start), endDate: toDate(end) }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'generate_lead', matchType: 'EXACT' },
          },
        },
      },
    })
    let total = 0
    for (const row of resp.data.rows || []) {
      total += parseInt(row.metricValues?.[0]?.value || '0', 10)
    }
    return total
  } catch (err) {
    console.warn('GA4 quiz query failed:', err)
    return 0
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const startStr = searchParams.get('start')
    const endStr = searchParams.get('end')

    const end = endStr ? new Date(endStr) : new Date()
    const start = startStr
      ? new Date(startStr)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dateKey = `${start.toISOString()}_${end.toISOString()}`
    const cacheKey = `leads_${dateKey}`
    const cachedResponse = getCached<any>(cacheKey)
    if (cachedResponse) {
      console.log('[Leads] Returning cached response')
      return NextResponse.json(cachedResponse)
    }

    const apiKey = process.env.MAILERLITE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'MAILERLITE_API_KEY missing' },
        { status: 500 }
      )
    }

    const [coaching, programWaitlist, seminarWaitlist, quiz] = await Promise.all([
      countSubscribersInGroup(GROUPS.coaching, apiKey, start, end),
      countSubscribersInGroup(GROUPS.program_waitlist, apiKey, start, end),
      countSubscribersInGroup(GROUPS.seminar_waitlist, apiKey, start, end),
      getQuizLeads(start, end),
    ])

    const total = coaching + programWaitlist + seminarWaitlist + quiz

    setCached(cacheKey, {
      success: true,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      leads: {
        coaching,
        program_waitlist: programWaitlist,
        seminar_waitlist: seminarWaitlist,
        quiz,
        total,
      },
      timestamp: new Date().toISOString(),
    }, 300) // 5 min cache

    return NextResponse.json({
      success: true,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      leads: {
        coaching,
        program_waitlist: programWaitlist,
        seminar_waitlist: seminarWaitlist,
        quiz,
        total,
      },
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
