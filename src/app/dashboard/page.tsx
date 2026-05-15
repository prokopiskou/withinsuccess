'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getDateRange,
  getPreviousDateRange,
  percentChange,
  formatDateRange,
  type DateRangePreset,
} from '@/lib/dashboard/dateRanges'
import { usePersistedPreset } from '@/lib/dashboard/usePersistedPreset'
import RevenueChart from './components/RevenueChart'
import KPICard from './components/KPICard'
import TrafficSources from './components/TrafficSources'
import FunnelChart from './components/FunnelChart'
import TopPages from './components/TopPages'
import TrafficChart from './components/TrafficChart'
import SourceBreakdown from './components/SourceBreakdown'

type StripeData = {
  success: boolean
  summary: {
    totalRevenue: number
    purchaseCount: number
    aov: number
    currency: string
  }
  breakdown: {
    '63days': { count: number; revenue: number }
    '30days': { count: number; revenue: number }
    other: { count: number; revenue: number }
  }
  daily: Array<{
    date: string
    revenue: number
    count: number
  }>
  recent: Array<{
    id: string
    amount: number
    date: string
    product: string
  }>
}

type GA4Data = {
  success: boolean
  data: {
    activeUsers: string
    sessions: string
    pageViews: string
    engagementRate: string
  }
  daily?: Array<{
    date: string
    sessions: number
    users: number
    pageViews: number
  }>
}

type MailerLiteData = {
  success: boolean
  newSubscribersInRange: number
}

type TrafficData = {
  success: boolean
  totalSessions: number
  sources: Array<{
    sourceMedium: string
    source: string
    medium: string
    sessions: number
    users: number
    transactions: number
    revenue: number
    sessionsPercent: number
    conversionRate: number
  }>
}

type FunnelData = {
  success: boolean
  funnel: Array<{
    stage: string
    count: number
    label: string
  }>
}

type ContentData = {
  success: boolean
  pages: Array<{
    pagePath: string
    pageTitle: string
    views: number
    users: number
    avgEngagementTime: number
    bounceRate: number
  }>
}

type SourceBreakdownData = {
  success: boolean
  buckets: Array<{
    bucket: string
    label: string
    sales: number
    revenue: number
  }>
  total: { sales: number; revenue: number }
  products?: Array<{
    productId: string
    label: string
    total: { sales: number; revenue: number }
    buckets: {
      paid: { sales: number; revenue: number }
      organic: { sales: number; revenue: number }
      newsletter: { sales: number; revenue: number }
      unknown: { sales: number; revenue: number }
    }
  }>
}

const PRESETS: { preset: DateRangePreset; label: string }[] = [
  { preset: 'today', label: 'Σήμερα' },
  { preset: 'wtd', label: 'WTD' },
  { preset: 'mtd', label: 'MTD' },
  { preset: 'ytd', label: 'YTD' },
  { preset: 'last30', label: 'Last 30' },
  { preset: 'all', label: 'All' },
]

export default function DashboardPage() {
  const [preset, setPreset] = usePersistedPreset('last30')
  const [stripeData, setStripeData] = useState<StripeData | null>(null)
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null)
  const [mlData, setMlData] = useState<MailerLiteData | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null)
  const [stripePrev, setStripePrev] = useState<StripeData | null>(null)
  const [ga4Prev, setGa4Prev] = useState<GA4Data | null>(null)
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [funnelProduct, setFunnelProduct] = useState<
    'all' | '63days' | '30days' | 'coaching'
  >('all')
  const [contentData, setContentData] = useState<ContentData | null>(null)
  const [sourceBreakdownData, setSourceBreakdownData] =
    useState<SourceBreakdownData | null>(null)
  const [loading, setLoading] = useState(true)

  const range = getDateRange(preset)

  useEffect(() => {
    async function fetchData() {
      const range = getDateRange(preset)
      setLoading(true)
      try {
        const startISO = range.start.toISOString()
        const endISO = range.end.toISOString()

        const previousRange = getPreviousDateRange(preset, range)

        const currentFetches = [
          fetch(
            `/api/dashboard/stripe?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
          fetch(
            `/api/dashboard/ga4?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
          fetch(
            `/api/dashboard/mailerlite?start=${startISO}&end=${endISO}`
          ).then((r) => r.json()),
          fetch(
            `/api/dashboard/ga4-traffic?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
          fetch(
            `/api/dashboard/content?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
          fetch(
            `/api/dashboard/source-breakdown?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
        ]

        const previousFetches = previousRange
          ? [
              fetch(
                `/api/dashboard/stripe?start=${encodeURIComponent(
                  previousRange.start.toISOString()
                )}&end=${encodeURIComponent(previousRange.end.toISOString())}`
              ).then((r) => r.json()),
              fetch(
                `/api/dashboard/ga4?start=${encodeURIComponent(
                  previousRange.start.toISOString()
                )}&end=${encodeURIComponent(previousRange.end.toISOString())}`
              ).then((r) => r.json()),
            ]
          : []

        const [stripe, ga4, ml, traffic, content, sourceBreakdown, ...previousResults] =
          await Promise.all([...currentFetches, ...previousFetches])

        setStripeData(stripe)
        setGa4Data(ga4)
        setMlData(ml)
        setTrafficData(traffic)
        setContentData(content)
        setSourceBreakdownData(sourceBreakdown)

        if (previousRange && previousResults.length === 2) {
          setStripePrev(previousResults[0])
          setGa4Prev(previousResults[1])
        } else {
          setStripePrev(null)
          setGa4Prev(null)
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [preset])

  useEffect(() => {
    async function fetchFunnel() {
      const range = getDateRange(preset)
      const startISO = range.start.toISOString()
      const endISO = range.end.toISOString()
      try {
        const funnel = await fetch(
          `/api/dashboard/funnel?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}${funnelProduct !== 'all' ? `&product=${funnelProduct}` : ''}`
        ).then((r) => r.json())
        setFunnelData(funnel)
      } catch (err) {
        console.error('Funnel fetch error:', err)
      }
    }
    fetchFunnel()
  }, [preset, range.start.getTime(), range.end.getTime(), funnelProduct])

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-4 sm:px-8 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              WithinSuccess Dashboard
            </h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">
              {formatDateRange(range)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-nowrap gap-1 overflow-x-auto -mx-2 px-2 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {PRESETS.map((p) => (
                <button
                  key={p.preset}
                  onClick={() => setPreset(p.preset)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                    preset === p.preset
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Link
              href="/dashboard/paid"
              className="text-xs text-gray-600 transition-colors hover:text-black px-3 py-1 border border-gray-200 rounded-full hover:border-black"
            >
              Paid Performance →
            </Link>
            <Link
              href="/dashboard/organic"
              className="text-xs text-gray-600 hover:text-black transition-colors px-3 py-1 border border-gray-200 rounded-full hover:border-black"
            >
              Organic →
            </Link>
            <Link
              href="/dashboard/leads"
              className="text-xs text-gray-600 hover:text-black transition-colors px-3 py-1 border border-gray-200 rounded-full hover:border-black"
            >
              Leads →
            </Link>
            <button
              onClick={async () => {
                await fetch('/api/dashboard/auth/logout', { method: 'POST' })
                window.location.href = '/dashboard/login'
              }}
              className="ml-2 text-xs text-gray-400 transition-colors hover:text-black"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:space-y-12 sm:px-8 sm:py-8">
        {loading ? (
          <p className="text-sm text-gray-500">Φόρτωση…</p>
        ) : (
          <>
            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  SUMMARY
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {stripeData?.success ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <KPICard
                    label="Έσοδα"
                    value={`€${stripeData.summary.totalRevenue.toLocaleString(
                      'el-GR',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`}
                    change={
                      stripeData && stripePrev
                        ? percentChange(
                            stripeData.summary.totalRevenue,
                            stripePrev.summary.totalRevenue
                          )
                        : undefined
                    }
                  />
                  <KPICard
                    label="Πληρωμές"
                    value={stripeData.summary.purchaseCount.toString()}
                    change={
                      stripeData && stripePrev
                        ? percentChange(
                            stripeData.summary.purchaseCount,
                            stripePrev.summary.purchaseCount
                          )
                        : undefined
                    }
                  />
                  <KPICard
                    label="AOV"
                    value={`€${stripeData.summary.aov.toFixed(2)}`}
                    change={
                      stripeData && stripePrev
                        ? percentChange(
                            stripeData.summary.aov,
                            stripePrev.summary.aov
                          )
                        : undefined
                    }
                  />
                  <KPICard
                    label="Active users"
                    value={
                      ga4Data?.success
                        ? Number(ga4Data.data.activeUsers).toLocaleString(
                            'el-GR'
                          )
                        : '—'
                    }
                    change={
                      ga4Data?.success && ga4Prev?.success
                        ? percentChange(
                            Number(ga4Data.data.activeUsers),
                            Number(ga4Prev.data.activeUsers)
                          )
                        : undefined
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-red-600">
                  {(stripeData as { error?: string })?.error ||
                    'Δεν ήταν δυνατή η φόρτωση Stripe.'}
                </p>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  REVENUE TREND
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {stripeData?.daily ? (
                <RevenueChart data={stripeData.daily} showYears={preset === 'all'} />
              ) : (
                <div className="h-64 animate-pulse rounded-2xl bg-gray-50" />
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  PRODUCTS
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {stripeData?.success ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  {(['63days', '30days', 'other'] as const).map((key) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6"
                    >
                      <p className="text-xs font-medium uppercase text-gray-500">
                        {key}
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        €{stripeData.breakdown[key].revenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {stripeData.breakdown[key].count} πληρωμές
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  SOURCE BREAKDOWN
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {sourceBreakdownData?.success ? (
                <SourceBreakdown
                  buckets={sourceBreakdownData.buckets}
                  total={sourceBreakdownData.total}
                  products={sourceBreakdownData.products}
                />
              ) : (
                <div className="h-48 animate-pulse rounded-2xl bg-gray-50" />
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  TRAFFIC
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {ga4Data?.success ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                  <KPICard
                    label="Sessions"
                    value={Number(ga4Data.data.sessions).toLocaleString(
                      'el-GR'
                    )}
                    change={
                      ga4Data && ga4Prev?.success
                        ? percentChange(
                            Number(ga4Data.data.sessions),
                            Number(ga4Prev.data.sessions)
                          )
                        : undefined
                    }
                  />
                  <KPICard
                    label="Page views"
                    value={Number(ga4Data.data.pageViews).toLocaleString(
                      'el-GR'
                    )}
                    change={
                      ga4Data && ga4Prev?.success
                        ? percentChange(
                            Number(ga4Data.data.pageViews),
                            Number(ga4Prev.data.pageViews)
                          )
                        : undefined
                    }
                  />
                  <KPICard
                    label="Engagement Rate"
                    value={
                      ga4Data
                        ? Number(ga4Data.data.engagementRate).toLocaleString(
                            'el-GR',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )
                        : '—'
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-red-600">
                  {(ga4Data as { error_message?: string })?.error_message ||
                    'Δεν ήταν δυνατή η φόρτωση GA4.'}
                </p>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  TRAFFIC TREND
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {ga4Data?.daily ? (
                <TrafficChart data={ga4Data.daily} showYears={preset === 'all'} />
              ) : (
                <div className="h-72 animate-pulse rounded-2xl bg-gray-50" />
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  TRAFFIC SOURCES
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {trafficData?.sources ? (
                <TrafficSources
                  sources={trafficData.sources}
                  totalSessions={trafficData.totalSessions}
                />
              ) : (
                <div className="h-96 animate-pulse rounded-2xl bg-gray-50" />
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                  <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                    CONVERSION FUNNEL
                  </p>
                  <p className="text-xs text-gray-300">·</p>
                  <p className="text-xs text-gray-400">{range.label}</p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(
                    [
                      { key: 'all', label: 'Όλα' },
                      { key: '63days', label: '63 Μέρες' },
                      { key: '30days', label: '30 Μέρες' },
                      { key: 'coaching', label: '1-on-1' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFunnelProduct(tab.key)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        funnelProduct === tab.key
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              {funnelData?.funnel ? (
                <FunnelChart funnel={funnelData.funnel} />
              ) : (
                <div className="h-96 bg-gray-50 rounded-2xl animate-pulse" />
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  TOP PAGES
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {contentData?.pages ? (
                <TopPages pages={contentData.pages} />
              ) : (
                <div className="h-96 animate-pulse rounded-2xl bg-gray-50" />
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  RECENT PURCHASES
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {stripeData?.success && stripeData.recent?.length ? (
                <div className="overflow-hidden rounded-2xl bg-gray-50">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px] text-left text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-2">Ημερομηνία</th>
                        <th className="px-4 py-2">Προϊόν</th>
                        <th className="px-4 py-2">Ποσό</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stripeData.recent.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-4 py-2 text-gray-700">
                            {new Date(row.date).toLocaleString('el-GR')}
                          </td>
                          <td className="px-4 py-2">{row.product}</td>
                          <td className="px-4 py-2 font-medium">
                            €{row.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              ) : stripeData?.success ? (
                <p className="text-sm text-gray-400">Δεν υπάρχουν πρόσφατες πληρωμές.</p>
              ) : null}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  MailerLite
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {mlData?.success ? (
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                  <KPICard
                    label="New Subscribers"
                    value={`+${mlData.newSubscribersInRange}`}
                  />
                </div>
              ) : (
                <p className="text-sm text-red-600">
                  {(mlData as { error?: string })?.error ||
                    'Δεν ήταν δυνατή η φόρτωση MailerLite.'}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
