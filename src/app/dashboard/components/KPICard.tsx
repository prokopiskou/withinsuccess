type KPICardProps = {
  label: string
  value: string
}

export default function KPICard({ label, value }: KPICardProps) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
