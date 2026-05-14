'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type DailyTraffic = {
  date: string
  sessions: number
  users: number
  pageViews: number
}

type Props = {
  data: DailyTraffic[]
  showYears?: boolean
}

type ChartDatum = DailyTraffic & {
  displayDate: string
  year: string
  showYear: boolean
}

type TickProps = {
  x?: number
  y?: number
  payload?: { value: string; index: number }
  chartData?: ChartDatum[]
}

function CustomXAxisTick({ x, y, payload, chartData }: TickProps) {
  if (!payload || x === undefined || y === undefined) return null

  const datum = chartData?.[payload.index]
  if (!datum) return null

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill="#9CA3AF"
        fontSize={11}
      >
        {datum.displayDate}
      </text>
      {datum.showYear && (
        <text
          x={0}
          y={0}
          dy={26}
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize={9}
          opacity={0.55}
          fontWeight={500}
        >
          {datum.year}
        </text>
      )}
    </g>
  )
}

export default function TrafficChart({ data, showYears = false }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
        Δεν υπάρχουν δεδομένα traffic για αυτή την περίοδο
      </div>
    )
  }

  // Format + year transitions
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

  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0)
  const totalUsers = data.reduce((sum, d) => sum + d.users, 0)
  const peakDay = data.reduce(
    (max, d) => (d.sessions > max.sessions ? d : max),
    data[0]
  )

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Total sessions
          </p>
          <p className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
            {totalSessions.toLocaleString('el-GR')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalUsers.toLocaleString('el-GR')} unique users
          </p>
        </div>
        {peakDay && peakDay.sessions > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Peak day
            </p>
            <p className="text-sm font-medium">
              {peakDay.sessions.toLocaleString('el-GR')} sessions
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {(() => {
                const [, month, day] = peakDay.date.split('-')
                return `${day}/${month}${showYears ? `/${peakDay.date.split('-')[0]}` : ''}`
              })()}
            </p>
          </div>
        )}
      </div>

      <div className="h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 15 }}>
            <defs>
              <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A1A1A" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#1A1A1A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.15} />
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
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={20}
              tick={<CustomXAxisTick chartData={formattedData} />}
              height={50}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={40}
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
              labelStyle={{
                color: '#737373',
                fontSize: '11px',
                textTransform: 'uppercase',
                marginBottom: '4px',
                letterSpacing: '0.05em',
              }}
              labelFormatter={(label, items) => {
                const item = items?.[0]?.payload as ChartDatum | undefined
                if (!item) return label
                return showYears ? `${item.displayDate}/${item.year}` : item.displayDate
              }}
            />
            <Area
              type="monotone"
              dataKey="sessions"
              stroke="#1A1A1A"
              strokeWidth={2}
              fill="url(#sessionsGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#1A1A1A', stroke: 'white', strokeWidth: 2 }}
              name="Sessions"
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#C9A96E"
              strokeWidth={2}
              fill="url(#usersGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#C9A96E', stroke: 'white', strokeWidth: 2 }}
              name="Users"
            />
            <Legend
              iconType="line"
              wrapperStyle={{
                fontSize: '11px',
                paddingTop: '8px',
              }}
              formatter={(value) => (
                <span style={{ color: '#737373' }}>{value}</span>
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
