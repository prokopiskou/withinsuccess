const META_API_BASE = 'https://graph.facebook.com/v21.0'

export type MetaInsightsParams = {
  level: 'account' | 'campaign' | 'adset' | 'ad'
  since: string // YYYY-MM-DD
  until: string // YYYY-MM-DD
  fields?: string[]
}

export async function fetchMetaInsights<T = unknown>(
  params: MetaInsightsParams
): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN
  const adAccountId = process.env.META_AD_ACCOUNT_ID

  if (!token) throw new Error('Missing META_ACCESS_TOKEN env var')
  if (!adAccountId) throw new Error('Missing META_AD_ACCOUNT_ID env var')

  const defaultFields = [
    'spend',
    'impressions',
    'clicks',
    'ctr',
    'cpc',
    'cpm',
    'reach',
    'frequency',
    'actions',
    'action_values',
    'campaign_name',
    'adset_name',
    'ad_name',
  ]

  const fields = (params.fields || defaultFields).join(',')

  const timeRange = JSON.stringify({
    since: params.since,
    until: params.until,
  })

  const url =
    `${META_API_BASE}/${adAccountId}/insights?` +
    `fields=${fields}` +
    `&level=${params.level}` +
    `&time_range=${encodeURIComponent(timeRange)}` +
    `&limit=500` +
    `&access_token=${token}`

  const response = await fetch(url)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Meta API error ${response.status}: ${text}`)
  }

  return response.json() as Promise<T>
}
