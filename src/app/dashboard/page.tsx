'use client'

import { useEffect, useState } from 'react'
import {
  getDateRange,
  getPreviousDateRange,
  percentChange,
  formatDateRange,
  type DateRangePreset,
} from '@/lib/dashboard/dateRanges'
import RevenueChart from './components/RevenueChart'
import KPICard from './components/KPICard'
import TrafficSources from './components/TrafficSources'

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

const PRESETS: { preset: DateRangePreset; label: string }[] = [
  { preset: 'today', label: 'Σήμερα' },
  { preset: 'wtd', label: 'WTD' },
  { preset: 'mtd', label: 'MTD' },
  { preset: 'ytd', label: 'YTD' },
  { preset: 'last30', label: 'Last 30' },
  { preset: 'all', label: 'All' },
]

export default function DashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>('mtd')
  const [stripeData, setStripeData] = useState<StripeData | null>(null)
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null)
  const [mlData, setMlData] = useState<MailerLiteData | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null)
  const [stripePrev, setStripePrev] = useState<StripeData | null>(null)
  const [ga4Prev, setGa4Prev] = useState<GA4Data | null>(null)
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

        const [stripe, ga4, ml, traffic, ...previousResults] =
          await Promise.all([...currentFetches, ...previousFetches])

        setStripeData(stripe)
        setGa4Data(ga4)
        setMlData(ml)
        setTrafficData(traffic)

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

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-8 py-6">
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

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.preset}
                  onClick={() => setPreset(p.preset)}
                  className={`px-4 py-2 text-sm rounded-full transition-colors ${
                    preset === p.preset
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={async () => {
                await fetch('/api/dashboard/auth/logout', { method: 'POST' })
                window.location.href = '/dashboard/login'
              }}
              className="text-xs text-gray-400 hover:text-black transition-colors ml-2"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-8 py-8">
        {loading ? (
          <p className="text-sm text-gray-500">Φόρτωση…</p>
        ) : (
          <>
            <section>
              <div className="mb-4 flex items-baseline gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  SUMMARY
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {stripeData?.success ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="mb-4 flex items-baseline gap-3">
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
              <div className="mb-4 flex items-baseline gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  PRODUCTS
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {stripeData?.success ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {(['63days', '30days', 'other'] as const).map((key) => (
                    <div
                      key={key}
                      className="rounded-xl border border-gray-100 p-4"
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
              <div className="mb-4 flex items-baseline gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  RECENT PURCHASES
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {stripeData?.success && stripeData.recent?.length ? (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full min-w-[480px] text-left text-sm">
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
              ) : stripeData?.success ? (
                <p className="text-sm text-gray-400">Δεν υπάρχουν πρόσφατες πληρωμές.</p>
              ) : null}
            </section>

            <section>
              <div className="mb-4 flex items-baseline gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  TRAFFIC
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {ga4Data?.success ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    label="Engagement rate"
                    value={ga4Data.data.engagementRate}
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
              <div className="mb-4 flex items-baseline gap-3">
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
              <div className="mb-4 flex items-baseline gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  MailerLite
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {mlData?.success ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
