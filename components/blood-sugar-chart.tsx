"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import { Activity } from "lucide-react"
import type { BloodSugarReading } from "@/app/actions"
import type { LoggedMeal } from "@/components/history-log"

type ChartPoint = {
  label: string
  value: number
  note?: string
  isMeal?: boolean
  mealName?: string
  mealCarbs?: number
  timestamp: number
}

export function BloodSugarChart({
  readings,
  meals,
}: {
  readings: BloodSugarReading[]
  meals: LoggedMeal[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 260 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: 260 })
      }
    })
    observer.observe(el)
    setDimensions({ width: el.clientWidth, height: 260 })
    return () => observer.disconnect()
  }, [])

  const { chartData, yMin, yMax, mealMarkers } = useMemo(() => {
    const points: ChartPoint[] = readings
      .map((r) => ({
        label: new Date(r.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: r.value,
        note: r.note,
        timestamp: new Date(r.timestamp).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)

    const meals_pts: ChartPoint[] = []
    for (const meal of meals) {
      const mt = parseMealTime(meal.time)
      if (mt) {
        meals_pts.push({
          label: meal.time,
          value: 0,
          timestamp: mt.getTime(),
          isMeal: true,
          mealName: meal.meal_name,
          mealCarbs: meal.total_net_carbs_g,
        })
      }
    }

    const allTimes = [...points.map((p) => p.timestamp), ...meals_pts.map((p) => p.timestamp)]
    const allValues = points.map((p) => p.value)

    if (allTimes.length === 0) {
      return { chartData: [] as ChartPoint[], yMin: 40, yMax: 250, mealMarkers: [] as ChartPoint[] }
    }

    const minTime = Math.min(...allTimes)
    const maxTime = Math.max(...allTimes)

    return {
      chartData: points,
      yMin: Math.max(40, Math.min(...allValues, 70) - 20),
      yMax: Math.min(300, Math.max(...allValues, 180) + 30),
      mealMarkers: meals_pts,
    }
  }, [readings, meals])

  // SVG dimensions
  const pad = { top: 20, right: 16, bottom: 32, left: 40 }
  const svgW = dimensions.width
  const svgH = dimensions.height
  const plotW = Math.max(svgW - pad.left - pad.right, 100)
  const plotH = Math.max(svgH - pad.top - pad.bottom, 50)

  // Scales — readings only. Meal lines are no longer drawn on the chart
  // (their times always landed at the right edge), so meals no longer
  // influence the domain.
  const scaleTimes = chartData.map((d) => d.timestamp)
  const minT = scaleTimes.length > 0 ? Math.min(...scaleTimes) : Date.now() - 3600000
  const maxT = scaleTimes.length > 0 ? Math.max(...scaleTimes) : Date.now()
  const tRange = Math.max(maxT - minT, 3600000)

  const xScale = (t: number) => pad.left + ((t - minT) / tRange) * plotW
  const yScale = (v: number) => pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH

  // Build line path
  const linePath =
    chartData.length > 1
      ? chartData
          .map((p, i) => {
            const x = xScale(p.timestamp)
            const y = yScale(p.value)
            return `${i === 0 ? "M" : "L"} ${x} ${y}`
          })
          .join(" ")
      : ""

  // Build area path
  const areaPath =
    chartData.length > 1
      ? linePath +
        ` L ${xScale(chartData[chartData.length - 1].timestamp)} ${pad.top + plotH}` +
        ` L ${xScale(chartData[0].timestamp)} ${pad.top + plotH} Z`
      : ""

  // Y-axis ticks
  const yTicks = []
  const yStep = Math.max(20, Math.round((yMax - yMin) / 5 / 10) * 10)
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
    yTicks.push(v)
  }

  // X-axis ticks — adaptive interval so a multi-day span shows ~6–8 readable
  // labels (dates / day+hour) instead of hundreds of repeated hourly times.
  const HOUR = 3600000
  const DAY = 24 * HOUR
  const tickSteps = [
    30 * 60000,
    HOUR,
    2 * HOUR,
    3 * HOUR,
    6 * HOUR,
    12 * HOUR,
    DAY,
    2 * DAY,
    7 * DAY,
  ]
  const tickStep = tickSteps.find((s) => s >= tRange / 6) ?? 14 * DAY
  const xTicks: { label: string; x: number }[] = []
  const firstTick = Math.ceil(minT / tickStep) * tickStep
  for (let t = firstTick; t <= maxT; t += tickStep) {
    const d = new Date(t)
    const x = xScale(t)
    if (x < pad.left || x > pad.left + plotW) continue
    const label =
      tickStep >= DAY
        ? d.toLocaleDateString([], { month: "short", day: "numeric" })
        : tickStep >= 6 * HOUR
          ? `${d.toLocaleDateString([], { weekday: "short" })} ${d.toLocaleTimeString([], { hour: "numeric" })}`
          : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    xTicks.push({ label, x })
  }

  // Hover state — index of the reading snapped to under the cursor
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const hoveredPoint = hoverIndex !== null ? (chartData[hoverIndex] ?? null) : null
  // Nearest meal within an hour of the hovered reading, so its context shows too
  const hoveredMeal = hoveredPoint
    ? mealMarkers.reduce<ChartPoint | null>((best, m) => {
        if (Math.abs(m.timestamp - hoveredPoint.timestamp) > 60 * 60000) return best
        if (
          !best ||
          Math.abs(m.timestamp - hoveredPoint.timestamp) <
            Math.abs(best.timestamp - hoveredPoint.timestamp)
        )
          return m
        return best
      }, null)
    : null

  if (readings.length === 0 && meals.length === 0) return null

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
          <Activity className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold text-card-foreground">Glucose Trend</h3>
          <p className="text-xs text-muted-foreground">
            {readings.length} reading{readings.length !== 1 ? "s" : ""} &middot; {meals.length} meal
            {meals.length !== 1 ? "s" : ""} today
          </p>
        </div>
      </div>

      <div ref={containerRef} className="relative mt-6">
        {svgW > 0 && (
          <svg
            width={svgW}
            height={svgH}
            className="overflow-visible"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Target range background */}
            <rect
              x={pad.left}
              y={yScale(180)}
              width={plotW}
              height={yScale(70) - yScale(180)}
              fill="var(--primary)"
              fillOpacity={0.06}
              rx={4}
            />

            {/* Y-axis grid lines */}
            {yTicks.map((v) => (
              <g key={v}>
                <line
                  x1={pad.left}
                  y1={yScale(v)}
                  x2={pad.left + plotW}
                  y2={yScale(v)}
                  stroke="var(--border)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text
                  x={pad.left - 6}
                  y={yScale(v) + 4}
                  textAnchor="end"
                  fill="var(--muted-foreground)"
                  fontSize={11}
                  fontFamily="inherit"
                >
                  {v}
                </text>
              </g>
            ))}

            {/* Reference lines */}
            {/* Low 70 */}
            <line
              x1={pad.left}
              y1={yScale(70)}
              x2={pad.left + plotW}
              y2={yScale(70)}
              stroke="var(--chart-2)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <text
              x={pad.left + plotW - 4}
              y={yScale(70) - 4}
              textAnchor="end"
              fill="var(--chart-2)"
              fontSize={10}
              fontFamily="inherit"
            >
              Low 70
            </text>

            {/* High 180 */}
            <line
              x1={pad.left}
              y1={yScale(180)}
              x2={pad.left + plotW}
              y2={yScale(180)}
              stroke="var(--chart-5)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <text
              x={pad.left + plotW - 4}
              y={yScale(180) - 4}
              textAnchor="end"
              fill="var(--chart-5)"
              fontSize={10}
              fontFamily="inherit"
            >
              High 180
            </text>

            {/* Area fill */}
            {areaPath && <path d={areaPath} fill="var(--primary)" fillOpacity={0.1} />}

            {/* Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Data dots */}
            {chartData.map((p, i) => (
              <circle
                key={i}
                cx={xScale(p.timestamp)}
                cy={yScale(p.value)}
                r={hoverIndex === i ? 7 : 5}
                fill={p.value > 180 ? "var(--destructive)" : "var(--primary)"}
                stroke="var(--card)"
                strokeWidth={2}
              />
            ))}

            {/* X-axis */}
            <line
              x1={pad.left}
              y1={pad.top + plotH}
              x2={pad.left + plotW}
              y2={pad.top + plotH}
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* X-axis ticks */}
            {xTicks.map((t, i) => (
              <text
                key={i}
                x={t.x}
                y={pad.top + plotH + 18}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize={11}
                fontFamily="inherit"
              >
                {t.label}
              </text>
            ))}

            {/* Hover crosshair */}
            {hoveredPoint && (
              <line
                x1={xScale(hoveredPoint.timestamp)}
                y1={pad.top}
                x2={xScale(hoveredPoint.timestamp)}
                y2={pad.top + plotH}
                stroke="var(--foreground)"
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.35}
                pointerEvents="none"
              />
            )}

            {/* Hover capture layer — snaps to the nearest reading anywhere in the plot */}
            <rect
              x={pad.left}
              y={pad.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onMouseMove={(e) => {
                if (chartData.length === 0) return
                const svgEl = e.currentTarget.ownerSVGElement
                if (!svgEl) return
                const rect = svgEl.getBoundingClientRect()
                const mx = e.clientX - rect.left
                const t = minT + ((mx - pad.left) / plotW) * tRange
                let best = 0
                for (let i = 1; i < chartData.length; i++) {
                  if (
                    Math.abs(chartData[i].timestamp - t) <
                    Math.abs(chartData[best].timestamp - t)
                  ) {
                    best = i
                  }
                }
                setHoverIndex(best)
              }}
            />
          </svg>
        )}

        {/* HTML Tooltip — full data for the hovered point */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{
              left: Math.min(
                Math.max(xScale(hoveredPoint.timestamp), 80),
                Math.max(svgW - 80, 80),
              ),
              top: yScale(hoveredPoint.value) - 10,
            }}
          >
            <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
              <p className="text-xs font-medium text-muted-foreground">
                {new Date(hoveredPoint.timestamp).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {hoveredPoint.value}{" "}
                <span className="text-sm font-normal text-muted-foreground">mg/dL</span>{" "}
                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      hoveredPoint.value > 180
                        ? "var(--destructive)"
                        : hoveredPoint.value < 70
                          ? "var(--chart-2)"
                          : "var(--primary)",
                  }}
                >
                  {hoveredPoint.value > 180
                    ? "High"
                    : hoveredPoint.value < 70
                      ? "Low"
                      : "In range"}
                </span>
              </p>
              {hoveredPoint.note && (
                <p className="mt-0.5 text-xs text-muted-foreground">{hoveredPoint.note}</p>
              )}
              {hoveredMeal && (
                <p className="mt-1 border-t border-border pt-1 text-xs text-muted-foreground">
                  🍽️ {hoveredMeal.mealName}
                  {typeof hoveredMeal.mealCarbs === "number"
                    ? ` · ${hoveredMeal.mealCarbs}g net carbs`
                    : ""}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm bg-primary/10" />
          Target range 70–180
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-primary" />
          Glucose reading
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-3 border-0 border-t-2 border-dashed align-middle" style={{ borderTopColor: "var(--chart-2)" }} />
          Low threshold
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-3 border-0 border-t-2 border-dashed align-middle" style={{ borderTopColor: "var(--chart-5)" }} />
          High alert
        </span>
      </div>
    </div>
  )
}

function parseMealTime(timeStr: string): Date | null {
  // Modern browsers (Chrome/Edge/Safari with recent ICU) format AM/PM with a
  // narrow no-break space (U+202F) or no-break space (U+00A0) — not a regular
  // space — so a plain split(" ") used to produce "22\u202fPM" and NaN minutes,
  // yielding an Invalid Date that silently rendered nothing on the chart.
  const normalized = timeStr.replace(/[\u00a0\u202f]/g, " ").trim()
  const now = new Date()
  const [time, period] = normalized.split(" ")
  if (!time) return null
  const [h, m] = time.split(":").map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  let hours = h
  if (period?.toLowerCase() === "pm" && hours !== 12) hours += 12
  if (period?.toLowerCase() === "am" && hours === 12) hours = 0
  const d = new Date(now)
  d.setHours(hours, m, 0, 0)
  return d
}
