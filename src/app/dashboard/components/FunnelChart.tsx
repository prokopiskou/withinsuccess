'use client'

type FunnelStep = {
  stage: string
  count: number
  label: string
}

type Props = {
  funnel: FunnelStep[]
}

// Benchmarks per stage (conversion rate from PREVIOUS step)
// Based on personal development / digital products industry
const STAGE_BENCHMARKS: Record<string, {
  excellent: number   // green
  good: number        // light green
  warning: number     // yellow
  // below warning → red (critical)
}> = {
  'Engaged':        { excellent: 35, good: 25, warning: 15 },
  'Viewed Pricing': { excellent: 50, good: 35, warning: 20 },
  'Began Checkout': { excellent: 20, good: 12, warning: 6 },
  'Purchased':      { excellent: 70, good: 50, warning: 30 },
}

// Suggested actions for poor performance per stage
const STAGE_ACTIONS: Record<string, string> = {
  'Engaged':        'Landing page δεν αρπάζει. Δοκίμασε άλλο hook, πιο γρήγορο value statement, λιγότερο scroll για main message.',
  'Viewed Pricing': 'Engagement γίνεται αλλά δεν σπρώχνει σε αγορά. Πιο δυνατό CTA, social proof, πιο φανερό pricing button.',
  'Began Checkout': 'Pricing δεν πείθει. Έλεγξε urgency, guarantees, ή timing του pricing reveal.',
  'Purchased':      'Checkout abandonment. Πιθανώς UX issues — μέθοδοι πληρωμής, trust badges, mobile checkout.',
}

type DiagnosticResult = {
  weakestStepIndex: number
  weakestStage: string
  weakestRate: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

function diagnose(funnel: FunnelStep[]): DiagnosticResult | null {
  if (funnel.length < 2) return null

  let weakestIndex = 1
  let worstScore = Infinity  // lower score = worse

  for (let i = 1; i < funnel.length; i++) {
    const stage = funnel[i]
    const prev = funnel[i - 1]
    const rate = prev.count > 0 ? (stage.count / prev.count) * 100 : 0
    const benchmark = STAGE_BENCHMARKS[stage.stage] || { excellent: 50, good: 30, warning: 15 }
    
    // Score: how far below "good" benchmark
    const score = rate / benchmark.good
    
    if (score < worstScore) {
      worstScore = score
      weakestIndex = i
    }
  }

  const stage = funnel[weakestIndex]
  const prev = funnel[weakestIndex - 1]
  const rate = prev.count > 0 ? (stage.count / prev.count) * 100 : 0
  const benchmark = STAGE_BENCHMARKS[stage.stage] || { excellent: 50, good: 30, warning: 15 }

  let status: 'excellent' | 'good' | 'warning' | 'critical' = 'critical'
  if (rate >= benchmark.excellent) status = 'excellent'
  else if (rate >= benchmark.good) status = 'good'
  else if (rate >= benchmark.warning) status = 'warning'

  return {
    weakestStepIndex: weakestIndex,
    weakestStage: stage.stage,
    weakestRate: rate,
    status,
  }
}

function getStatusColor(rate: number, stage: string): { color: string; bg: string; label: string } {
  const benchmark = STAGE_BENCHMARKS[stage] || { excellent: 50, good: 30, warning: 15 }
  if (rate >= benchmark.excellent) return { color: '#15803D', bg: '#F0FDF4', label: 'Excellent' }
  if (rate >= benchmark.good) return { color: '#65A30D', bg: '#F7FEE7', label: 'Healthy' }
  if (rate >= benchmark.warning) return { color: '#A16207', bg: '#FEFCE8', label: 'Watch' }
  return { color: '#B91C1C', bg: '#FEF2F2', label: 'Fix' }
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
  const lastStep = funnel[funnel.length - 1]
  const overallConv = topOfFunnel > 0 ? (lastStep.count / topOfFunnel) * 100 : 0

  const diagnostic = diagnose(funnel)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header with diagnostic */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Overall conversion
            </p>
            <p className="text-2xl font-semibold mt-1" style={{ fontFamily: 'Georgia, serif' }}>
              {overallConv.toFixed(2)}%
            </p>
          </div>
          {diagnostic && (diagnostic.status === 'warning' || diagnostic.status === 'critical') && (
            <div className="text-right max-w-xs">
              <p className="text-[10px] uppercase tracking-wider text-red-700 mb-1">
                🎯 Focus εδώ
              </p>
              <p className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                Step {diagnostic.weakestStepIndex + 1}: {funnel[diagnostic.weakestStepIndex].label}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {diagnostic.weakestRate.toFixed(1)}% conv rate
              </p>
            </div>
          )}
        </div>

        {/* Suggested action */}
        {diagnostic && (diagnostic.status === 'warning' || diagnostic.status === 'critical') && (
          <div 
            className="mt-3 px-3 py-2 rounded-lg text-xs leading-relaxed"
            style={{ 
              backgroundColor: diagnostic.status === 'critical' ? '#FEF2F2' : '#FEFCE8',
              color: diagnostic.status === 'critical' ? '#B91C1C' : '#A16207',
            }}
          >
            <span className="font-medium">Action: </span>
            {STAGE_ACTIONS[diagnostic.weakestStage] || 'Εξέτασε αυτό το step.'}
          </div>
        )}
      </div>

      {/* Funnel steps */}
      <div className="divide-y divide-gray-100">
        {funnel.map((step, idx) => {
          const widthPercent = (step.count / maxCount) * 100
          const prevCount = idx > 0 ? funnel[idx - 1].count : null
          const stepConvRate = prevCount && prevCount > 0
            ? (step.count / prevCount) * 100
            : null
          const dropOff = prevCount !== null ? prevCount - step.count : 0
          const status = stepConvRate !== null ? getStatusColor(stepConvRate, step.stage) : null
          const isWeakest = diagnostic?.weakestStepIndex === idx

          return (
            <div 
              key={step.stage} 
              className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
              style={{
                backgroundColor: isWeakest && (diagnostic.status === 'warning' || diagnostic.status === 'critical')
                  ? (diagnostic.status === 'critical' ? '#FFFBFB' : '#FFFEF7')
                  : undefined,
              }}
            >
              <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-baseline gap-3 min-w-0 flex-1">
                  <span className="text-xs text-gray-300 font-mono w-5 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                        {step.label}
                      </p>
                      {status && idx > 0 && (
                        <span 
                          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"
                          style={{ color: status.color, backgroundColor: status.bg }}
                        >
                          {status.label}
                        </span>
                      )}
                      {isWeakest && (diagnostic.status === 'warning' || diagnostic.status === 'critical') && (
                        <span className="text-xs">🎯</span>
                      )}
                    </div>
                    {stepConvRate !== null && (
                      <p className="text-xs mt-0.5" style={{ color: status?.color || '#737373' }}>
                        {stepConvRate.toFixed(1)}% συνέχισαν από προηγούμενο step
                        {dropOff > 0 && (
                          <span className="text-gray-400 ml-2">
                            · −{dropOff.toLocaleString('el-GR')} άτομα έφυγαν
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
                    backgroundColor: idx === funnel.length - 1 
                      ? '#C9A96E' 
                      : (status?.color || '#1A1A1A'),
                    opacity: status?.color ? 0.7 : (0.85 - idx * 0.1),
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
