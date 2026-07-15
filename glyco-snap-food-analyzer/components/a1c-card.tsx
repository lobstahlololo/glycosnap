import { Calculator, AlertTriangle, TrendingUp, Activity } from "lucide-react"
import { computeA1cStats, a1cZone, A1C_ZONE_COLORS, A1C_ZONE_LABEL, type A1cStats } from "@/lib/a1c"
import { DIABETES_PROFILES, type DiabetesType } from "@/lib/diabetes-profile"

export function A1cCard({
  readings,
  diabetesType,
}: {
  readings: Array<{ value: number; timestamp: string }>
  diabetesType: DiabetesType
}) {
  const stats = computeA1cStats(readings, diabetesType, 30)
  const profile = DIABETES_PROFILES[diabetesType]
  const target = profile.target
  const ideal = profile.a1cTarget.ideal

  if (!stats || stats.count < 3) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-lg font-semibold text-card-foreground">Glucose Snapshot</h3>
            <p className="text-xs text-muted-foreground">
              Estimated A1c, Time-in-Range & variability for {profile.shortLabel}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-8 text-center">
          <Activity className="h-7 w-7 text-primary/40" aria-hidden="true" />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Log at least <span className="font-semibold text-foreground">3 readings</span> to see your
            estimated A1c and Time-in-Range for {profile.shortLabel}. CGM data gives the most accurate
            estimate — try importing from your monitor.
          </p>
        </div>
      </section>
    )
  }

  const zone = a1cZone(stats, ideal)
  const zoneColor = A1C_ZONE_COLORS[zone]
  const density = stats.count / 30 // avg per day
  const lowDensity = density < 2 // manual fingerstick sparseness

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Calculator className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-card-foreground">Glucose Snapshot</h3>
          <p className="text-xs text-muted-foreground">
            Last {stats.windowDays} days · {stats.count} readings · target&nbsp;
            <span className="font-medium text-foreground">{target.low}–{target.high}&nbsp;mg/dL</span>
          </p>
        </div>
        <span
          className="hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-block"
          style={{ backgroundColor: `${zoneColor}1a`, color: zoneColor }}
        >
          {A1C_ZONE_LABEL[zone]}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Estimated A1c */}
        <div className="rounded-2xl bg-secondary/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estimated A1c</p>
          <p className="mt-2 font-serif text-4xl font-semibold tabular-nums text-foreground">
            {stats.estimatedA1c.toFixed(1)}
            <span className="text-base font-normal text-muted-foreground">%</span>
          </p>
          <p className="mt-1 text-xs italic text-muted-foreground">
            ADAG formula · ideal&nbsp;
            <span className="text-foreground">{ideal}%</span>
          </p>
          {lowDensity && (
            <p className="mt-2 inline-flex items-start gap-1.5 text-[11px] leading-tight text-[#8a5a1f]">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span>
                Based on sparse manual readings ({density.toFixed(1)}/day). CGM data improves accuracy.
              </span>
            </p>
          )}
        </div>

        {/* Time-in-Range */}
        <div className="rounded-2xl bg-secondary/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time-in-Range</p>
          <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-foreground">
            {Math.round(stats.timeInRange)}
            <span className="text-base font-normal text-muted-foreground">%</span>
          </p>
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
            <div
              className="h-full"
              style={{
                width: `${stats.timeBelow}%`,
                backgroundColor: "oklch(0.55 0.10 240)",
              }}
              title={`Below ${target.low}: ${Math.round(stats.timeBelow)}%`}
            />
            <div
              className="h-full"
              style={{
                width: `${stats.timeInRange}%`,
                backgroundColor: "oklch(0.58 0.08 150)",
              }}
              title={`In range ${target.low}–${target.high}: ${Math.round(stats.timeInRange)}%`}
            />
            <div
              className="h-full"
              style={{
                width: `${stats.timeAbove}%`,
                backgroundColor: "oklch(0.55 0.16 32)",
              }}
              title={`Above ${target.high}: ${Math.round(stats.timeAbove)}%`}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] tabular-nums">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.55 0.10 240)" }} />
              Below {Math.round(stats.timeBelow)}%
            </span>
            <span className="flex items-center gap-1.5 text-foreground/80">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.58 0.08 150)" }} />
              In&nbsp;{Math.round(stats.timeInRange)}%
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.55 0.16 32)" }} />
              Above {Math.round(stats.timeAbove)}%
            </span>
          </div>
        </div>

        {/* Avg + CV */}
        <div className="rounded-2xl bg-secondary/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average &amp; Variability</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-serif text-3xl font-semibold tabular-nums text-foreground">
              {Math.round(stats.mean)}
            </p>
            <p className="text-xs text-muted-foreground">mg/dL avg</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
            <div>
              <p className="text-muted-foreground">SD</p>
              <p className="font-semibold text-foreground">{stats.stddev.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CV</p>
              <p
                className="font-semibold"
                style={{
                  color:
                    stats.cv > 36
                      ? "oklch(0.55 0.16 32)"
                      : stats.cv > 30
                        ? "oklch(0.74 0.10 75)"
                        : "oklch(0.55 0.10 150)",
                }}
              >
                {stats.cv.toFixed(0)}%
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-tight text-muted-foreground">
            {stats.hypoEvents} severe low · {stats.hyperEvents} severe high events
          </p>
        </div>
      </div>

      {stats.confidence !== "high" && (
        <p className="mt-4 inline-flex items-start gap-1.5 text-[11px] italic leading-tight text-muted-foreground">
          <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          {stats.confidence === "moderate"
            ? `Moderate confidence based on ${stats.count} readings — sync a CGM for higher accuracy.`
            : `Low confidence — only ${stats.count} reading${stats.count === 1 ? "" : "s"}. More data improves the picture.`}
        </p>
      )}
    </section>
  )
}
