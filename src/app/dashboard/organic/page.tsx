'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDateRange, formatDateRange, type DateRangePreset } from '@/lib/dashboard/dateRanges'

type CategoryData = {
  category: string
  label: string
  visits: number
  sales: number
  revenue: number
  conversionRate: number
  products: Array<{ name: string; sales: number; revenue: number }>
}

type OrganicData = {
  success: boolean
  totals: { visits: number; sales: number; revenue: number; conversionRate: number }
  categories: CategoryData[]
}

const PRESETS: { preset: DateRangePreset; label: string }[] = [
  { preset: 'today', label: 'Σήμερα' },
  { preset: 'wtd', label: 'WTD' },
  { preset: 'mtd', label: 'MTD' },
  { preset: 'last7', label: 'Last 7' },
  { preset: 'last30', label: 'Last 30' },
  { preset: 'ytd', label: 'YTD' },
]

const CATEGORY_ICONS: Record<string, string> = {
  ig_bio: '📷',
  ig_stories: '🎞️',
  ig_manychat: '💬',
  fb_bio: '📘',
  fb_stories: '📱',
  fb_manychat: '💬',
  tiktok_bio: '🎵',
  threads_bio: '🧵',
  google_organic: '🔍',
  direct: '🌐',
  other_organic: '○',
}

export default function OrganicDashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>('last30')
  const [data, setData] = useState<OrganicData | null>(null)
  const [loading, setLoading] = useState(true)

  const range = getDateRange(preset)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const startISO = range.start.toISOString()
        const endISO = range.end.toISOString()
        const res = await fetch(`/api/dashboard/organic?start=${startISO}&end=${endISO}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Organic dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [preset, range.start, range.end])

  const maxVisits = Math.max(...(data?.categories.map(c => c.visits) || [1]), 1)

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <Link href="/dashboard" className="text-xs text-gray-400 hover:text-black transition-colors">
                ← Dashboard
              </Link>
              <span className="text-gray-200">·</span>
              <h1 className="text-xl sm:text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                Organic Performance
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">
              {formatDateRange(range)}
            </p>
          </div>
          <div className="flex gap-1 flex-nowrap overflow-x-auto sm:flex-wrap pb-1 sm:pb-0">
            {PRESETS.map((p) => (
              <button
                key={p.preset}
                onClick={() => setPreset(p.preset)}
                className={`px-4 py-2 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                  preset === p.preset ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {loading && (
          <div className="text-center py-12 text-gray-400">
            Φόρτωση organic data...
          </div>
        )}

        {!loading && data?.success && (
          <>
            <section>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
                OVERVIEW · {range.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Visits</p>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {data.totals.visits.toLocaleString('el-GR')}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Sales</p>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {data.totals.sales}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Revenue</p>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#C9A96E' }}>
                    €{data.totals.revenue.toFixed(0)}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Conv Rate</p>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {data.totals.conversionRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                  ΑΝΑ ΠΗΓΗ
                </p>
              </div>

              {data.categories.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
                  Δεν υπάρχουν organic πωλήσεις σε αυτή την περίοδο
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {data.categories.map((cat, idx) => {
                    const widthPercent = (cat.visits / maxVisits) * 100
                    return (
                      <div key={cat.category} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                          <div className="flex items-baseline gap-3 min-w-0 flex-1">
                            <span className="text-xs text-gray-300 font-mono w-5 flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm">{CATEGORY_ICONS[cat.category] || '○'}</span>
                                <p className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                                  {cat.label}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-baseline gap-3 sm:gap-5 text-right flex-shrink-0">
                            <div>
                              <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                                {cat.visits.toLocaleString('el-GR')}
                              </p>
                              <p className="text-[10px] text-gray-400">visits</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                                {cat.sales}
                              </p>
                              <p className="text-[10px] text-gray-400">sales</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif', color: cat.conversionRate >= 1 ? '#15803D' : cat.conversionRate >= 0.5 ? '#A16207' : '#737373' }}>
                                {cat.conversionRate.toFixed(2)}%
                              </p>
                              <p className="text-[10px] text-gray-400">conv</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#C9A96E' }}>
                                €{cat.revenue.toFixed(0)}
                              </p>
                              <p className="text-[10px] text-gray-400">revenue</p>
                            </div>
                          </div>
                        </div>

                        <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: cat.sales > 0 ? '#C9A96E' : '#9CA3AF',
                              opacity: cat.sales > 0 ? 0.7 : 0.4,
                            }}
                          />
                        </div>

                        {cat.products.length > 0 && (
                          <div className="ml-8 space-y-1 mt-2">
                            {cat.products.map((p, pIdx) => (
                              <div key={pIdx} className="flex items-baseline justify-between text-xs text-gray-500">
                                <span className="truncate flex-1 mr-3">└─ {p.name}</span>
                                <span className="text-gray-700 font-medium">
                                  {p.sales} × €{p.revenue.toFixed(0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {!loading && !data?.success && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
            Σφάλμα φόρτωσης organic data. Έλεγξε Stripe + API route.
          </div>
        )}
      </div>
    </main>
  )
}
