import { NextRequest, NextResponse } from 'next/server'
import { getGA4Client, getPropertyPath } from '@/lib/ga4Client'

export const dynamic = 'force-dynamic'

const GROUPS = {
  coaching: '184997659389461878',
  program_waitlist: '187457343070405693',  // 63 Days waitlist
  seminar_waitlist: '187522640873784777',
}

type CampaignStats = {
  name: string
  sent: number
  opens: number
  clicks: number
  openRate: number
  clickRate: number
  sentDate: string
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

async function getTotalSubscribers(apiKey: string): Promise<number> {
  // Try the groups endpoint - each group returns active_count
  // But we need the UNIQUE total of all subscribers (no double-count across groups)
  // Best approach: use stats from /api/account or paginate /api/subscribers
  
  // Approach 1: Try /api/stats endpoint
  try {
    const statsRes = await fetch('https://connect.mailerlite.com/api/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    })
    if (statsRes.ok) {
      const data = await statsRes.json()
      const total = data?.data?.subscribers?.active || data?.subscribers?.active || data?.data?.total_subscribers || 0
      if (total > 0) {
        console.log(`[Newsletter] Total subscribers from /api/account: ${total}`)
        return total
      }
    }
  } catch (err) {
    console.warn('Account endpoint failed:', err)
  }
  
  // Approach 2: Paginate and count active subscribers (slower but works)
  try {
    let count = 0
    let cursor: string | undefined
    let hasMore = true
    let pages = 0
    const maxPages = 200  // ~20,000 subscribers max
    
    while (hasMore && pages < maxPages) {
      const url = new URL('https://connect.mailerlite.com/api/subscribers')
      url.searchParams.set('filter[status]', 'active')
      url.searchParams.set('limit', '100')
      if (cursor) url.searchParams.set('cursor', cursor)
      
      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      })
      if (!res.ok) break
      const data = await res.json()
      const subs = data?.data || []
      count += subs.length
      cursor = data?.meta?.next_cursor || undefined
      hasMore = !!cursor && subs.length === 100
      pages++
    }
    
    console.log(`[Newsletter] Total subscribers via pagination: ${count} (${pages} pages)`)
    return count
  } catch (err) {
    console.warn('Pagination count failed:', err)
    return 0
  }
}

async function getRecentCampaigns(apiKey: string): Promise<CampaignStats[]> {
  try {
    const res = await fetch('https://connect.mailerlite.com/api/campaigns?filter[status]=sent&limit=5', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    const campaigns = data.data || []

    return campaigns.map((c: any): CampaignStats => {
      const stats = c.stats || {}
      const sent = stats.sent || 0
      const opens = stats.opens_count || 0
      const clicks = stats.clicks_count || 0
      return {
        name: c.name || '(no name)',
        sent,
        opens,
        clicks,
        openRate: sent > 0 ? (opens / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicks / sent) * 100 : 0,
        sentDate: c.finished_at || c.scheduled_for || c.created_at || '',
      }
    })
  } catch (err) {
    console.warn('Campaigns fetch failed:', err)
    return []
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

    const apiKey = process.env.MAILERLITE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'MAILERLITE_API_KEY missing' },
        { status: 500 }
      )
    }

    const [coaching, programWaitlist, seminarWaitlist, quiz, totalSubs, campaigns] = await Promise.all([
      countSubscribersInGroup(GROUPS.coaching, apiKey, start, end),
      countSubscribersInGroup(GROUPS.program_waitlist, apiKey, start, end),
      countSubscribersInGroup(GROUPS.seminar_waitlist, apiKey, start, end),
      getQuizLeads(start, end),
      getTotalSubscribers(apiKey),
      getRecentCampaigns(apiKey),
    ])

    const total = coaching + programWaitlist + seminarWaitlist + quiz

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
      newsletter: {
        totalSubscribers: totalSubs,
        recentCampaigns: campaigns,
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
