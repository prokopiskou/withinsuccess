'use client'

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

type DailyData = {
  date: string
  revenue: number
  count: number
}

type ChartDatum = DailyData & {
  displayDate: string
  year: string
  showYear: boolean
}

type Props = {
  data: DailyData[]
  showYears?: boolean
}

export default function RevenueChart({ data, showYears = false }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
        Δεν υπάρχουν δεδομένα για αυτή την περίοδο
      </div>
    )
  }

  // Format date for display (DD/MM) and tag year transitions
  let previousYear: string | null = null
  const formattedData: ChartDatum[] = data.map((d, idx) => {
    const [year, month, day] = d.date.split('-')
    const isYearTransition = idx === 0 || year !== previousYear
    previousYear = year
    return {
      ...d,
      displayDate: `${day}/${month}`,
      year,
      showYear: showYears && isYearTransition,
    }
  })

  // Calculate total for header
  const total = data.reduce((sum, d) => sum + d.revenue, 0)
  const peak = formattedData.reduce(
    (max, d) => (d.revenue > max.revenue ? d : max),
    formattedData[0]
  )

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Total για την περίοδο
          </p>
          <p className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            €{total.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        {peak && peak.revenue > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Peak day
            </p>
            <p className="text-sm font-medium">
              €{peak.revenue.toFixed(2)}{' '}
              <span className="text-gray-400">
                ({peak.displayDate}{showYears ? `/${peak.date.split('-')[0]}` : ''})
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="0" 
              stroke="#F0EBE0" 
              vertical={false}
            />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 11, fill: '#9CA3AF' }} 
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#9CA3AF' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${v}`}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E5E5',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
              labelStyle={{ color: '#737373', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}
              formatter={(value, name) => {
                if (name === 'revenue')
                  return [`€${Number(value).toFixed(2)}`, 'Revenue']
                return [value as string | number, name]
              }}
              labelFormatter={(label, items) => {
                const item = items?.[0]?.payload as ChartDatum | undefined
                if (!item) return label
                return showYears ? `${item.displayDate}/${item.year}` : item.displayDate
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#C9A96E"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#C9A96E', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
