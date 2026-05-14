'use client'

type Bucket = {
  bucket: string
  label: string
  sales: number
  revenue: number
}

type ProductBreakdown = {
  product: string
  label: string
  total: { sales: number; revenue: number }
  buckets: {
    paid: { sales: number; revenue: number }
    organic: { sales: number; revenue: number }
    newsletter: { sales: number; revenue: number }
    unknown: { sales: number; revenue: number }
  }
}

type Props = {
  buckets: Bucket[]
  total: { sales: number; revenue: number }
  products?: ProductBreakdown[]
}

const BUCKET_COLORS: Record<string, string> = {
  paid: '#C9A96E',       // gold
  organic: '#1A1A1A',    // black
  newsletter: '#3E5C76', // blue-gray
  unknown: '#9CA3AF',    // light gray
}

const BUCKET_LABELS: Record<string, string> = {
  paid: 'Paid Ads',
  organic: 'Organic',
  newsletter: 'Newsletter',
  unknown: 'Unknown',
}

function StackedBar({ buckets, total }: { buckets: Record<string, { sales: number; revenue: number }> | Bucket[]; total: number }) {
  // Normalize input to array of [key, data]
  const entries = Array.isArray(buckets)
    ? buckets.map((b) => ({ key: b.bucket, sales: b.sales }))
    : Object.entries(buckets).map(([key, val]) => ({ key, sales: val.sales }))

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
      {entries.map((e) => {
        const widthPercent = total > 0 ? (e.sales / total) * 100 : 0
        if (widthPercent === 0) return null
        return (
          <div
            key={e.key}
            style={{
              width: `${widthPercent}%`,
              backgroundColor: BUCKET_COLORS[e.key] || '#9CA3AF',
            }}
            title={`${BUCKET_LABELS[e.key] || e.key}: ${e.sales}`}
          />
        )
      })}
    </div>
  )
}

export default function SourceBreakdown({ buckets, total, products }: Props) {
  if (total.sales === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
        Δεν υπάρχουν πωλήσεις στην περίοδο
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* OVERALL */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-baseline justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Συνολικά</p>
          <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            {total.sales} sales · €{total.revenue.toFixed(0)}
          </p>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
          <StackedBar buckets={buckets} total={total.sales} />
        </div>

        <div className="divide-y divide-gray-100">
          {buckets.map((b) => {
            const percent = total.sales > 0 ? (b.sales / total.sales) * 100 : 0
            const revenuePercent = total.revenue > 0 ? (b.revenue / total.revenue) * 100 : 0

            return (
              <div key={b.bucket} className="px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="flex items-baseline gap-3 min-w-0">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: BUCKET_COLORS[b.bucket] || '#9CA3AF' }}
                    />
                    <p className="text-sm font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                      {b.label}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-4 sm:gap-6 text-right flex-shrink-0">
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                        {b.sales}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {percent.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#C9A96E' }}>
                        €{b.revenue.toFixed(0)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {revenuePercent.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PER PRODUCT */}
      {products && products.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Ανά Προϊόν</p>
          </div>

          <div className="divide-y divide-gray-100">
            {products.map((p) => (
              <div key={p.product} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                    {p.label}
                  </p>
                  <div className="flex items-baseline gap-4 sm:gap-6 text-right">
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                        {p.total.sales}
                      </p>
                      <p className="text-[10px] text-gray-400">sales</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#C9A96E' }}>
                        €{p.total.revenue.toFixed(0)}
                      </p>
                      <p className="text-[10px] text-gray-400">revenue</p>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <StackedBar buckets={p.buckets} total={p.total.sales} />
                </div>

                <div className="flex items-center gap-4 flex-wrap text-[11px]">
                  {Object.entries(p.buckets).map(([key, val]) => {
                    if (val.sales === 0) return null
                    return (
                      <div key={key} className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: BUCKET_COLORS[key] }}
                        />
                        <span className="text-gray-500">{BUCKET_LABELS[key]}:</span>
                        <span className="font-medium text-gray-700">{val.sales}</span>
                        <span className="text-gray-400">· €{val.revenue.toFixed(0)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
