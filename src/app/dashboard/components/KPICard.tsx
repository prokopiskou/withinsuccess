type KPICardProps = {
  label: string
  value: string
  subtitle?: string
  change?: number | null
}

export default function KPICard({
  label,
  value,
  subtitle,
  change,
}: KPICardProps) {
  const hasChange = typeof change === 'number' && isFinite(change)
  const isUp = hasChange && (change as number) >= 0
  const arrow = isUp ? '▲' : '▼'
  const changeColor = isUp ? '#0F766E' : '#B91C1C'

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 transition-colors hover:border-gray-200">
      <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p
        className="text-3xl font-semibold tracking-tight"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {value}
      </p>
      <div className="mt-2 flex min-h-[16px] items-center gap-2">
        {hasChange && (
          <span
            className="flex items-center gap-0.5 text-xs font-medium"
            style={{ color: changeColor }}
          >
            <span className="text-[10px]">{arrow}</span>
            {Math.abs(change as number).toFixed(0)}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-gray-400">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
