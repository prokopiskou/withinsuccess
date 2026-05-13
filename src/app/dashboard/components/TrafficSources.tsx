'use client'

type Source = {
  sourceMedium: string
  source: string
  medium: string
  sessions: number
  users: number
  transactions: number
  revenue: number
  sessionsPercent: number
  conversionRate: number
}

type Props = {
  sources: Source[]
  totalSessions: number
}

// Get color for medium (for visual variety)
function getMediumColor(medium: string): string {
  const colors: Record<string, string> = {
    organic: '#3E5C76',
    cpc: '#C9A96E',
    email: '#8B7340',
    social: '#A78BFA',
    referral: '#525252',
    '(none)': '#9CA3AF',
  }
  return colors[medium.toLowerCase()] || '#737373'
}

function formatSourceLabel(source: string, medium: string): string {
  // Make direct/none more readable
  if (source === '(direct)' && medium === '(none)') return 'Direct'
  return `${source} / ${medium}`
}

export default function TrafficSources({ sources, totalSessions }: Props) {
  if (!sources || sources.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
        Δεν υπάρχουν δεδομένα traffic για αυτή την περίοδο
      </div>
    )
  }

  // Show top 10
  const topSources = sources.slice(0, 10)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-baseline justify-between">
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          Top 10 Sources
        </p>
        <p className="text-xs text-gray-400">
          {totalSessions.toLocaleString('el-GR')} sessions total
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {topSources.map((s, idx) => (
          <div key={s.sourceMedium} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <div className="flex items-baseline gap-3 min-w-0 flex-1">
                <span className="text-xs text-gray-300 font-mono w-5">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium truncate">
                  {formatSourceLabel(s.source, s.medium)}
                </span>
              </div>
              <div className="flex items-baseline gap-6 text-right flex-shrink-0">
                <div>
                  <p className="text-sm font-semibold">
                    {s.sessions.toLocaleString('el-GR')}
                  </p>
                  <p className="text-xs text-gray-400">sessions</p>
                </div>
                {s.transactions > 0 && (
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#C9A96E' }}>
                      {s.transactions}
                    </p>
                    <p className="text-xs text-gray-400">conv</p>
                  </div>
                )}
                {s.revenue > 0 && (
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold">
                      €{s.revenue.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-400">revenue</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bar visualization */}
            <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${s.sessionsPercent}%`,
                  backgroundColor: getMediumColor(s.medium),
                }}
              />
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>{s.sessionsPercent.toFixed(1)}% του traffic</span>
              {s.sessions > 0 && s.transactions > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{s.conversionRate.toFixed(2)}% conv rate</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
