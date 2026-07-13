type MetricRingProps = {
  label: string
  value: number
  unit: string
  /** value that represents a "full" ring, used only for the visual fill */
  max: number
  color: string
  icon: React.ReactNode
}

export function MetricRing({ label, value, unit, max, color, icon }: MetricRingProps) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, value / max))
  const dash = circumference * pct

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ color }}>{icon}</span>
          <span className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {Math.round(value)}
            <span className="text-xs font-normal text-muted-foreground">{unit}</span>
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
