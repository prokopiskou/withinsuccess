'use client'

type AdBreakdown = {
  content: string
  sales: number
  revenue: number
}

type CampaignBreakdown = {
  campaign: string
  source: string
  ads: AdBreakdown[]
  sales: number
  revenue: number
}

type AttributionTotals = {
  totalSales: number
  totalRevenue: number
  paidSales: number
  paidRevenue: number
  organicSales: number
  organicRevenue: number
  unknownSales: number
  unknownRevenue: number
}

type Props = {
  totals: AttributionTotals
  campaigns: CampaignBreakdown[]
}

export default function AttributionView({ totals, campaigns }: Props) {
  const maxRevenue = Math.max(...campaigns.map((c) => c.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Totals classification */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <ClassCard 
          label="Από Ads" 
          sales={totals.paidSales} 
          revenue={totals.paidRevenue}
          color="#C9A96E"
        />
        <ClassCard 
          label="Organic" 
          sales={totals.organicSales} 
          revenue={totals.organicRevenue}
          color="#1A1A1A"
        />
        <ClassCard 
          label="Unknown" 
          sales={totals.unknownSales} 
          revenue={totals.unknownRevenue}
          color="#9CA3AF"
        />
        <ClassCard 
          label="Total" 
          sales={totals.totalSales} 
          revenue={totals.totalRevenue}
          color="#1A1A1A"
          highlight
        />
      </div>

      {/* Campaign breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Per Campaign · Ground Truth
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Από Stripe metadata. Κάθε payment ξέρει source του.
          </p>
        </div>

        {campaigns.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Δεν υπάρχουν payments σε αυτή την περίοδο
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {campaigns.map((c, idx) => {
              const widthPercent = (c.revenue / maxRevenue) * 100
              const isPaid = c.source === 'fb' || c.source === 'ig' || c.source === 'facebook' || c.source === 'instagram'

              return (
                <div key={c.campaign} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-baseline gap-3 min-w-0 flex-1">
                      <span className="text-xs text-gray-300 font-mono w-5 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                            {c.campaign}
                          </p>
                          {isPaid && (
                            <span 
                              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"
                              style={{ color: '#8B7340', backgroundColor: '#FAF6EF' }}
                            >
                              PAID
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {c.source}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-4 sm:gap-6 text-right flex-shrink-0">
                      <div>
                        <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                          {c.sales}
                        </p>
                        <p className="text-xs text-gray-400">sales</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#C9A96E' }}>
                          €{c.revenue.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-400">revenue</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: isPaid ? '#C9A96E' : '#1A1A1A',
                        opacity: 0.6,
                      }}
                    />
                  </div>

                  {/* Per-ad creative breakdown */}
                  {c.ads.length > 0 && (
                    <div className="ml-8 space-y-1.5 mt-3">
                      {c.ads.map((a, adIdx) => (
                        <div key={adIdx} className="flex items-baseline justify-between text-xs text-gray-500">
                          <span className="truncate flex-1 mr-3">└─ {a.content}</span>
                          <span className="text-gray-700 font-medium">
                            {a.sales} × €{a.revenue.toFixed(0)}
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
      </div>
    </div>
  )
}

function ClassCard({ 
  label, 
  sales, 
  revenue,
  color,
  highlight,
}: { 
  label: string
  sales: number
  revenue: number
  color: string
  highlight?: boolean
}) {
  return (
    <div 
      className="bg-white border rounded-2xl p-4 sm:p-5"
      style={{ borderColor: highlight ? color : '#F0EBE0' }}
    >
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
        {label}
      </p>
      <p 
        className="text-xl sm:text-2xl font-semibold tracking-tight mb-1" 
        style={{ 
          fontFamily: 'Georgia, serif',
          color: highlight ? color : '#1A1A1A',
        }}
      >
        {sales}
      </p>
      <p className="text-xs text-gray-400">
        €{revenue.toFixed(0)} revenue
      </p>
    </div>
  )
}
