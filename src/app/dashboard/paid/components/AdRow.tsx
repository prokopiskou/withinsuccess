'use client'

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

type Props = {
  data: AdData
  rank: number
  maxSpend: number
}

function getROASStatus(roas: number, hasPurchases: boolean): { color: string; bg: string; label: string } {
  if (!hasPurchases) return { color: '#9CA3AF', bg: '#F5F5F5', label: '—' }
  if (roas >= 3) return { color: '#15803D', bg: '#F0FDF4', label: 'Strong' }
  if (roas >= 2) return { color: '#854D0E', bg: '#FEFCE8', label: 'Good' }
  if (roas >= 1) return { color: '#9A3412', bg: '#FFF7ED', label: 'Break-even' }
  return { color: '#B91C1C', bg: '#FEF2F2', label: 'Losing €' }
}

export default function AdRow({ data, rank, maxSpend }: Props) {
  const hasPurchases = data.purchases > 0
  const status = getROASStatus(data.roas, hasPurchases)
  const widthPercent = (data.spend / maxSpend) * 100
  const isTop = rank === 1 && hasPurchases

  return (
    <div className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0 flex-1">
          <span className="text-xs text-gray-300 font-mono w-5 flex-shrink-0">
            {rank}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isTop && <span style={{ color: '#C9A96E' }}>🏆</span>}
              <p className="text-sm font-medium truncate" style={{ fontFamily: 'Georgia, serif' }}>
                {data.name}
              </p>
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"
                style={{ color: status.color, backgroundColor: status.bg }}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar visualization (spend share) */}
      <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${widthPercent}%`,
            backgroundColor: hasPurchases ? '#C9A96E' : '#9CA3AF',
            opacity: hasPurchases ? 0.7 : 0.4,
          }}
        />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">Spend</p>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Georgia, serif' }}>
            €{data.spend.toFixed(0)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">Revenue</p>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Georgia, serif', color: hasPurchases ? '#C9A96E' : '#737373' }}>
            €{data.revenue.toFixed(0)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">ROAS</p>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Georgia, serif', color: status.color }}>
            {hasPurchases ? `${data.roas.toFixed(2)}x` : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">CAC</p>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Georgia, serif' }}>
            {hasPurchases ? `€${data.cac.toFixed(0)}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">CTR</p>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Georgia, serif' }}>
            {data.ctr.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">Purchases</p>
          <p className="font-semibold text-sm" style={{ fontFamily: 'Georgia, serif' }}>
            {data.purchases}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
        <span>{data.impressions.toLocaleString('el-GR')} impressions</span>
        <span className="text-gray-300">·</span>
        <span>{data.clicks.toLocaleString('el-GR')} clicks</span>
        <span className="text-gray-300">·</span>
        <span>CPC €{data.cpc.toFixed(2)}</span>
        <span className="text-gray-300">·</span>
        <span>Reach {data.reach.toLocaleString('el-GR')}</span>
      </div>
    </div>
  )
}
