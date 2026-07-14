"use client"

import { useMemo, type JSX } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity } from "lucide-react"
import type { MealAnalysis } from "@/app/actions"
import type { BloodSugarReading } from "@/app/actions"
import type { LoggedMeal } from "@/components/history-log"

type ChartPoint = {
  time: string
  label: string
  value: number
  note?: string
  isMeal?: boolean
  mealName?: string
  mealCarbs?: number
}

export function BloodSugarChart({
  readings,
  meals,
}: {
  readings: BloodSugarReading[]
  meals: LoggedMeal[]
}) {
  const chartData = useMemo(() => {
    const points: ChartPoint[] = readings.map((r) => {
      const d = new Date(r.timestamp)
      return {
        time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        label: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        value: r.value,
        note: r.note,
      }
    })

    // Add meal markers as annotations in the nearest reading or standalone
    // We add meal time reference points when there's no reading near them
    const mealPoints: ChartPoint[] = []
    for (const meal of meals) {
      const mealTime = parseMealTime(meal.time)
      if (mealTime) {
        // Find if there's a blood sugar reading within 15 minutes of this meal
        const nearby = readings.some((r) => {
          const rt = new Date(r.timestamp)
          const diff = Math.abs(rt.getTime() - mealTime.getTime())
          return diff < 15 * 60 * 1000
        })
        // If no nearby reading, add a reference marker on the meal time
        if (!nearby) {
          const d = mealTime
          mealPoints.push({
            time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            label: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            value: 70, // placeholder — this point won't render as a line
            isMeal: true,
            mealName: meal.meal_name,
            mealCarbs: meal.total_net_carbs_g,
          })
        }
      }
    }

    // Sort all points by time
    const all = [...points, ...mealPoints].sort((a, b) => {
      return a.label.localeCompare(b.label)
    })

    return all
  }, [readings, meals])

  // Custom tooltip
  function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
    if (!active || !payload?.[0]) return null
    const p = payload[0].payload
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground">{p.time}</p>
        {p.isMeal ? (
          <div className="mt-1">
            <p className="text-sm font-semibold text-foreground">🍽️ {p.mealName}</p>
            {p.mealCarbs !== undefined && (
              <p className="text-xs text-muted-foreground">{Math.round(p.mealCarbs)}g net carbs</p>
            )}
          </div>
        ) : (
          <>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{p.value} <span className="text-sm font-normal text-muted-foreground">mg/dL</span></p>
            {p.note && <p className="mt-0.5 text-xs text-muted-foreground">{p.note}</p>}
          </>
        )}
      </div>
    )
  }

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
            {readings.length} reading{readings.length !== 1 ? "s" : ""} &middot;{" "}
            {meals.length} meal{meals.length !== 1 ? "s" : ""} today
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              domain={[40, 250]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} />

            {/* Target range zone: 70-180 mg/dL */}
            <ReferenceLine
              y={70}
              stroke="var(--chart-2)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "Low 70",
                position: "insideBottomLeft",
                fill: "var(--chart-2)",
                fontSize: 10,
                offset: 10,
              }}
            />
            <ReferenceLine
              y={180}
              stroke="var(--chart-5)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "High 180",
                position: "insideTopLeft",
                fill: "var(--chart-5)",
                fontSize: 10,
                offset: 10,
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#glucoseGradient)"
              dot={(props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
                if (!props.payload || props.payload.isMeal) return null
                const isRecent = props.payload.value > 180
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={isRecent ? "var(--destructive)" : "var(--primary)"}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={(props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
                if (!props.payload || props.payload.isMeal) return null
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={6}
                    fill="var(--primary)"
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                )
              }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm bg-primary/20" />
          Target range 70–180
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-primary" />
          Glucose reading
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full border-0" style={{ borderTop: "2px dashed var(--chart-2)" }} />
          Low threshold
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full border-0" style={{ borderTop: "2px dashed var(--chart-5)" }} />
          High alert
        </span>
      </div>
    </div>
  )
}

function parseMealTime(timeStr: string): Date | null {
  const now = new Date()
  const [time, period] = timeStr.split(" ")
  if (!time) return null
  const [h, m] = time.split(":").map(Number)
  if (h === undefined || m === undefined) return null
  let hours = h
  if (period?.toLowerCase() === "pm" && hours !== 12) hours += 12
  if (period?.toLowerCase() === "am" && hours === 12) hours = 0
  const d = new Date(now)
  d.setHours(hours, m, 0, 0)
  return d
}
