import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaInsights } from '@/lib/metaAdsClient'

export const dynamic = 'force-dynamic'

type MetaInsightRow = {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  reach?: string
  frequency?: string
  campaign_name?: string
  adset_name?: string
  ad_name?: string
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
}

type MetaResponse = {
  data: MetaInsightRow[]
  paging?: { next?: string }
}

function toMetaDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function extractActionValue(row: MetaInsightRow, actionType: string): number {
  const action = row.actions?.find((a) => a.action_type === actionType)
  return action ? parseFloat(action.value) : 0
}

function extractActionMonetaryValue(row: MetaInsightRow, actionType: string): number {
  const action = row.action_values?.find((a) => a.action_type === actionType)
  return action ? parseFloat(action.value) : 0
}

/**
 * GET /api/dashboard/meta-ads?start=ISO&end=ISO
 *
 * Returns:
 * - overall: spend, impressions, clicks, ctr, cpc, conversions, revenue, ROAS, CAC
 * - campaigns: per-campaign breakdown
 * - adsets: per-adset breakdown
 * - ads: per-ad creative breakdown
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

    const since = toMetaDate(start)
    const until = toMetaDate(end)

    // Fetch all levels in parallel
    const [accountResp, campaignsResp, adsetsResp, adsResp] = await Promise.all([
      fetchMetaInsights<MetaResponse>({ level: 'account', since, until }),
      fetchMetaInsights<MetaResponse>({ level: 'campaign', since, until }),
      fetchMetaInsights<MetaResponse>({ level: 'adset', since, until }),
      fetchMetaInsights<MetaResponse>({ level: 'ad', since, until }),
    ])

    // Transform helper
    const transform = (
      rows: MetaInsightRow[],
      levelKey: 'campaign_name' | 'adset_name' | 'ad_name' | null = null
    ) => {
      return rows.map((row) => {
        const purchases =
          extractActionValue(row, 'purchase') + extractActionValue(row, 'omni_purchase')
        const revenue =
          extractActionMonetaryValue(row, 'purchase') +
          extractActionMonetaryValue(row, 'omni_purchase')
        const spend = parseFloat(row.spend || '0')

        return {
          name: levelKey ? row[levelKey] || '(unnamed)' : 'Overall',
          spend,
          impressions: parseInt(row.impressions || '0', 10),
          clicks: parseInt(row.clicks || '0', 10),
          ctr: parseFloat(row.ctr || '0'),
          cpc: parseFloat(row.cpc || '0'),
          cpm: parseFloat(row.cpm || '0'),
          reach: parseInt(row.reach || '0', 10),
          frequency: parseFloat(row.frequency || '0'),
          purchases,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          cac: purchases > 0 ? spend / purchases : 0,
        }
      })
    }

    const overall = transform(accountResp.data || [])[0] || null
    const campaigns = transform(campaignsResp.data || [], 'campaign_name').sort(
      (a, b) => b.spend - a.spend
    )
    const adsets = transform(adsetsResp.data || [], 'adset_name').sort(
      (a, b) => b.spend - a.spend
    )
    const ads = transform(adsResp.data || [], 'ad_name').sort((a, b) => b.spend - a.spend)

    return NextResponse.json({
      success: true,
      dateRange: { since, until },
      overall,
      campaigns,
      adsets,
      ads,
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
