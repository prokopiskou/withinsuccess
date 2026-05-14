'use client'

type ProductStats = {
  product: string
  label: string
  price: number
  sales: number
  revenue: number
  adSpend: number
  cac: number
  roas: number
  margin: number
}

type Props = {
  products: ProductStats[]
}

function statusForROAS(roas: number, hasSpend: boolean): { color: string; label: string } {
  if (!hasSpend) return { color: '#737373', label: 'No spend' }
  if (roas >= 3) return { color: '#15803D', label: 'Strong' }
  if (roas >= 2) return { color: '#65A30D', label: 'Good' }
  if (roas >= 1) return { color: '#A16207', label: 'Break-even' }
  return { color: '#B91C1C', label: 'Losing €' }
}

function statusForMargin(margin: number, hasSpend: boolean): { color: string; sign: string } {
  if (!hasSpend) return { color: '#737373', sign: '' }
  if (margin > 0) return { color: '#15803D', sign: '+' }
  if (margin < 0) return { color: '#B91C1C', sign: '' }
  return { color: '#737373', sign: '' }
}

export default function PerProductBreakdown({ products }: Props) {
  // Only show products with sales or spend
  const active = products.filter((p) => p.sales > 0 || p.adSpend > 0)

  if (active.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
        Δεν υπάρχουν δεδομένα ανά προϊόν για αυτή την περίοδο
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {active.map((p) => {
        const hasSpend = p.adSpend > 0
        const roasStatus = statusForROAS(p.roas, hasSpend)
        const marginStatus = statusForMargin(p.margin, hasSpend)

        return (
          <div key={p.product} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
                {p.label}
              </h3>
              {p.price > 0 && (
                <span className="text-xs text-gray-400">€{p.price}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Sales</p>
                <p className="font-semibold text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                  {p.sales}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Revenue</p>
                <p className="font-semibold text-lg" style={{ fontFamily: 'Georgia, serif', color: '#C9A96E' }}>
                  €{p.revenue.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Ad Spend</p>
                <p className="font-semibold text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                  €{p.adSpend.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">CAC</p>
                <p className="font-semibold text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                  {p.sales > 0 ? `€${p.cac.toFixed(0)}` : '—'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-4 pt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">ROAS</p>
                <p className="font-semibold text-base" style={{ fontFamily: 'Georgia, serif', color: roasStatus.color }}>
                  {hasSpend ? `${p.roas.toFixed(2)}x` : '—'}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: roasStatus.color }}>
                  {roasStatus.label}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Margin</p>
                <p className="font-semibold text-base" style={{ fontFamily: 'Georgia, serif', color: marginStatus.color }}>
                  {hasSpend ? `${marginStatus.sign}€${p.margin.toFixed(0)}` : `€${p.margin.toFixed(0)}`}
                </p>
                <p className="text-[10px] mt-0.5 text-gray-400">
                  {hasSpend ? '(after ads)' : '(no ad cost)'}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
