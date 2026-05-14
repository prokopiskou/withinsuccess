'use client'

type FunnelStep = {
  stage: string
  count: number
  label: string
}

type Props = {
  funnel: FunnelStep[]
}

export default function FunnelChart({ funnel }: Props) {
  if (!funnel || funnel.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
        Δεν υπάρχουν δεδομένα funnel
      </div>
    )
  }

  const maxCount = Math.max(...funnel.map((s) => s.count), 1)
  const topOfFunnel = funnel[0]?.count || 1

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          Συνολικό funnel
        </p>
        <p className="text-2xl font-semibold mt-1" style={{ fontFamily: 'Georgia, serif' }}>
          {topOfFunnel > 0 && funnel[funnel.length - 1].count > 0
            ? `${((funnel[funnel.length - 1].count / topOfFunnel) * 100).toFixed(2)}%`
            : '—'}
        </p>
        <p className="text-xs text-gray-400 mt-1">overall conversion rate</p>
      </div>

      <div className="divide-y divide-gray-100">
        {funnel.map((step, idx) => {
          const widthPercent = (step.count / maxCount) * 100
          const prevCount = idx > 0 ? funnel[idx - 1].count : null
          const stepConvRate = prevCount && prevCount > 0
            ? (step.count / prevCount) * 100
            : null
          const dropOff = prevCount !== null ? prevCount - step.count : 0

          return (
            <div key={step.stage} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-baseline gap-3 min-w-0 flex-1">
                  <span className="text-xs text-gray-300 font-mono w-5 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                      {step.label}
                    </p>
                    {stepConvRate !== null && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {stepConvRate.toFixed(1)}% του προηγούμενου
                        {dropOff > 0 && (
                          <span className="text-gray-300 ml-2">
                            · −{dropOff.toLocaleString('el-GR')} drop
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                    {step.count.toLocaleString('el-GR')}
                  </p>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: idx === funnel.length - 1 ? '#C9A96E' : '#1A1A1A',
                    opacity: 0.85 - idx * 0.1,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
