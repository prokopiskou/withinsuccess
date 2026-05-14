'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getDateRange,
  formatDateRange,
  type DateRangePreset,
} from '@/lib/dashboard/dateRanges'
import AdRow from './components/AdRow'
import AttributionView from './components/AttributionView'
import PerProductBreakdown from './components/PerProductBreakdown'

type AdData = {
  name: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  reach: number
  frequency: number
  purchases: number
  revenue: number
  roas: number
  cac: number
}

type MetaData = {
  success: boolean
  overall: AdData | null
  campaigns: AdData[]
  adsets: AdData[]
  ads: AdData[]
}

type AttributionData = {
  success: boolean
  totals: {
    totalSales: number
    totalRevenue: number
    paidSales: number
    paidRevenue: number
    organicSales: number
    organicRevenue: number
    unknownSales: number
    unknownRevenue: number
  }
  campaigns: Array<{
    campaign: string
    source: string
    ads: Array<{ content: string; sales: number; revenue: number }>
    sales: number
    revenue: number
  }>
}

type PerProductData = {
  success: boolean
  products: Array<{
    productId: string
    label: string
    price: number
    sales: number
    revenue: number
    adSpend: number
    cac: number
    roas: number
    margin: number
  }>
}

const PRESETS: { preset: DateRangePreset; label: string }[] = [
  { preset: 'today', label: 'Σήμερα' },
  { preset: 'wtd', label: 'WTD' },
  { preset: 'mtd', label: 'MTD' },
  { preset: 'last7', label: 'Last 7' },
  { preset: 'last30', label: 'Last 30' },
  { preset: 'ytd', label: 'YTD' },
]

type View = 'campaigns' | 'adsets' | 'ads'

export default function PaidDashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>('last30')
  const [view, setView] = useState<View>('ads')
  const [data, setData] = useState<MetaData | null>(null)
  const [attributionData, setAttributionData] = useState<AttributionData | null>(null)
  const [perProductData, setPerProductData] = useState<PerProductData | null>(null)
  const [loading, setLoading] = useState(true)

  const range = getDateRange(preset)

  useEffect(() => {
    async function fetchData() {
      const range = getDateRange(preset)
      setLoading(true)
      try {
        const startISO = range.start.toISOString()
        const endISO = range.end.toISOString()

        const [metaRes, attrRes, perProductRes] = await Promise.all([
          fetch(
            `/api/dashboard/meta-ads?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
          fetch(
            `/api/dashboard/attribution?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
          fetch(
            `/api/dashboard/per-product?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
          ).then((r) => r.json()),
        ])
        setData(metaRes)
        setAttributionData(attrRes)
        setPerProductData(perProductRes)
      } catch (err) {
        console.error('Paid dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [preset])

  const items = data
    ? view === 'campaigns'
      ? data.campaigns
      : view === 'adsets'
        ? data.adsets
        : data.ads
    : []
  const maxSpend = Math.max(...items.map((i) => i.spend), 1)

  return (
    <main className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="border-b border-gray-100 px-4 py-4 sm:px-8 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <Link
                href="/dashboard"
                className="text-xs text-gray-400 transition-colors hover:text-black"
              >
                ← Dashboard
              </Link>
              <span className="text-gray-200">·</span>
              <h1
                className="text-xl font-semibold sm:text-2xl"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Paid Performance
              </h1>
            </div>
            <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">
              {formatDateRange(range)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-nowrap gap-1 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
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
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:space-y-12 sm:px-8 sm:py-8">
        {loading && (
          <div className="py-12 text-center text-gray-400">
            Φόρτωση Meta Ads data...
          </div>
        )}

        {!loading && data?.success && (
          <>
            {/* OVERVIEW KPIs */}
            <section>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                OVERVIEW · {range.label}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                <KPI
                  label="Spend"
                  value={`€${(data.overall?.spend || 0).toLocaleString('el-GR', { maximumFractionDigits: 0 })}`}
                />
                <KPI
                  label="Revenue"
                  value={`€${(data.overall?.revenue || 0).toLocaleString('el-GR', { maximumFractionDigits: 0 })}`}
                  highlight
                />
                <KPI
                  label="ROAS"
                  value={
                    data.overall?.purchases
                      ? `${data.overall.roas.toFixed(2)}x`
                      : '—'
                  }
                  color={
                    (data.overall?.roas || 0) >= 2
                      ? '#15803D'
                      : (data.overall?.roas || 0) >= 1
                        ? '#854D0E'
                        : '#B91C1C'
                  }
                />
                <KPI
                  label="CAC"
                  value={
                    data.overall?.purchases
                      ? `€${data.overall.cac.toFixed(0)}`
                      : '—'
                  }
                />
                <KPI
                  label="Purchases"
                  value={(data.overall?.purchases || 0).toString()}
                />
              </div>
            </section>

            <section>
              <div className="flex items-baseline gap-2 sm:gap-3 mb-4 flex-wrap">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                  PER PRODUCT
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {perProductData?.products ? (
                <PerProductBreakdown products={perProductData.products} />
              ) : (
                <div className="h-48 bg-gray-50 rounded-2xl animate-pulse" />
              )}
            </section>

            <section>
              <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                  ATTRIBUTION · STRIPE GROUND TRUTH
                </p>
                <p className="text-xs text-gray-300">·</p>
                <p className="text-xs text-gray-400">{range.label}</p>
              </div>
              {attributionData?.success ? (
                <AttributionView
                  totals={attributionData.totals}
                  campaigns={attributionData.campaigns}
                />
              ) : (
                <div className="h-96 bg-gray-50 rounded-2xl animate-pulse" />
              )}
            </section>

            {/* VIEW TOGGLE */}
            <section>
              <div className="mb-4 flex flex-wrap items-baseline gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  BREAKDOWN
                </p>
                <div className="ml-auto flex gap-1">
                  {(['campaigns', 'adsets', 'ads'] as View[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                        view === v
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
                  Δεν υπάρχουν δεδομένα για αυτή την περίοδο
                </div>
              ) : (
                <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  {items.map((item, idx) => (
                    <AdRow
                      key={`${item.name}-${idx}`}
                      data={item}
                      rank={idx + 1}
                      maxSpend={maxSpend}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {!loading && !data?.success && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
            Σφάλμα φόρτωσης Meta Ads data. Έλεγξε token + ad account ID.
          </div>
        )}
      </div>
    </main>
  )
}

function KPI({
  label,
  value,
  highlight,
  color,
}: {
  label: string
  value: string
  highlight?: boolean
  color?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">{label}</p>
      <p
        className="text-xl font-semibold tracking-tight sm:text-2xl"
        style={{
          fontFamily: 'Georgia, serif',
          color: color || (highlight ? '#C9A96E' : '#1A1A1A'),
        }}
      >
        {value}
      </p>
    </div>
  )
}
