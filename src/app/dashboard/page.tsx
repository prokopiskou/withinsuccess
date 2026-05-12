'use client'

import { useEffect, useState } from 'react'
import {
  getDateRange,
  formatDateRange,
  type DateRangePreset,
} from '@/lib/dashboard/dateRanges'

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
  newSubscribersLast7Days: number
  stats?: {
    total: number
    active: number
    unsubscribed: number
    unconfirmed: number
    bounced: number
    junk: number
  }
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
  const [loading, setLoading] = useState(true)

  const range = getDateRange(preset)

  useEffect(() => {
    async function fetchData() {
      const range = getDateRange(preset)
      setLoading(true)
      try {
        const startISO = range.start.toISOString()
        const endISO = range.end.toISOString()

        const [stripe, ga4, ml] = await Promise.all([
          fetch(
            `/api/dashboard/stripe?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
          fetch(
            `/api/dashboard/ga4?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
          fetch('/api/dashboard/mailerlite').then((r) => r.json()),
        ])

        setStripeData(stripe)
        setGa4Data(ga4)
        setMlData(ml)
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

          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.preset}
                type="button"
                onClick={() => setPreset(p.preset)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  preset === p.preset
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
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
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Έσοδα</p>
                    <p className="mt-1 text-2xl font-semibold">
                      €{stripeData.summary.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Πληρωμές</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {stripeData.summary.purchaseCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">AOV</p>
                    <p className="mt-1 text-2xl font-semibold">
                      €{stripeData.summary.aov.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Νόμισμα</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {stripeData.summary.currency}
                    </p>
                  </div>
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Active users</p>
                    <p className="mt-1 text-xl font-semibold">
                      {ga4Data.data.activeUsers}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Sessions</p>
                    <p className="mt-1 text-xl font-semibold">
                      {ga4Data.data.sessions}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Page views</p>
                    <p className="mt-1 text-xl font-semibold">
                      {ga4Data.data.pageViews}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Engagement rate</p>
                    <p className="mt-1 text-xl font-semibold">
                      {ga4Data.data.engagementRate}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-600">
                  {(ga4Data as { error_message?: string })?.error_message ||
                    'Δεν ήταν δυνατή η φόρτωση GA4.'}
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                MailerLite
              </h2>
              {mlData?.success ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Νέοι (7 ημέρες)</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {mlData.newSubscribersLast7Days}
                    </p>
                  </div>
                  {mlData.stats ? (
                    <>
                      <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500">Active</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {mlData.stats.active}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500">Σύνολο</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {mlData.stats.total}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500">Unsubscribed</p>
                        <p className="mt-1 text-2xl font-semibold">
                          {mlData.stats.unsubscribed}
                        </p>
                      </div>
                    </>
                  ) : null}
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
