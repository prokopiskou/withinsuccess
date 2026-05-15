'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDateRange, formatDateRange, type DateRangePreset } from '@/lib/dashboard/dateRanges'
import { usePersistedPreset } from '@/lib/dashboard/usePersistedPreset'

type LeadsData = {
  success: boolean
  error?: string
  leads?: {
    coaching: number
    program_waitlist: number
    seminar_waitlist: number
    quiz: number
    total: number
  }
}

const PRESETS: { preset: DateRangePreset; label: string }[] = [
  { preset: 'today', label: 'Σήμερα' },
  { preset: 'wtd', label: 'WTD' },
  { preset: 'mtd', label: 'MTD' },
  { preset: 'last7', label: 'Last 7' },
  { preset: 'last30', label: 'Last 30' },
  { preset: 'ytd', label: 'YTD' },
]

const LEAD_TYPES = [
  { key: 'quiz', label: 'Quiz / Assessment', icon: '🎯', color: '#1A1A1A' },
  { key: 'program_waitlist', label: '63 Days Waitlist', icon: '🔒', color: '#C9A96E' },
  { key: 'seminar_waitlist', label: 'Seminar Waitlist', icon: '🎤', color: '#1A1A1A' },
  { key: 'coaching', label: 'Coaching Applications', icon: '💎', color: '#15803D' },
] as const

export default function LeadsDashboardPage() {
  const [preset, setPreset] = usePersistedPreset('last30')
  const [data, setData] = useState<LeadsData | null>(null)
  const [loading, setLoading] = useState(true)

  const range = getDateRange(preset)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      try {
        const r = getDateRange(preset)
        const res = await fetch(`/api/dashboard/leads?start=${r.start.toISOString()}&end=${r.end.toISOString()}`)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        console.error('Leads dashboard error:', err)
        if (!cancelled) setData({ success: false, error: 'Network error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()

    return () => { cancelled = true }
  }, [preset])

  const leads = data?.leads
  const hasLeads = data?.success && leads && leads.total > 0
  const maxLeadValue = leads
    ? Math.max(leads.coaching, leads.program_waitlist, leads.seminar_waitlist, leads.quiz, 1)
    : 1

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
                Leads
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
          <div className="text-center py-12 text-gray-400 text-sm">
            Φόρτωση leads...
          </div>
        )}

        {!loading && !data?.success && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-700">
            Σφάλμα: {data?.error || 'unknown'}
          </div>
        )}

        {!loading && data?.success && leads && (
          <>
            <section>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
                OVERVIEW · {range.label}
              </p>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Leads</p>
                <p className="text-4xl sm:text-5xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  {leads.total}
                </p>
              </div>
            </section>

            <section>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
                ΑΝΑ ΤΥΠΟ
              </p>
              {!hasLeads ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
                  Δεν υπάρχουν leads σε αυτή την περίοδο
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {LEAD_TYPES.map((type) => {
                    const value = leads[type.key as keyof typeof leads] as number
                    const widthPercent = (value / maxLeadValue) * 100
                    return (
                      <div key={type.key} className="px-6 py-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-base">{type.icon}</span>
                            <p className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                              {type.label}
                            </p>
                          </div>
                          <p className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                            {value}
                          </p>
                        </div>
                        <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: type.color,
                              opacity: value > 0 ? 0.8 : 0.2,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
