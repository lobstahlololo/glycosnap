"use client"

import { useEffect, useState, useRef } from "react"
import { Brain, Lightbulb, Loader2, Sparkles } from "lucide-react"
import { getGlucoseInsightAction, type GlucoseInsight, type BloodSugarReading } from "@/app/actions"
import type { LoggedMeal } from "@/components/history-log"
import { cn } from "@/lib/utils"

const CONCERN_STYLES: Record<GlucoseInsight["concern_level"], string> = {
  Good: "bg-[#e7efe0] text-[#42583a] border-[#c9d8bd]",
  Caution: "bg-[#f6e8d1] text-[#8a5a1f] border-[#e6cfa2]",
  Elevated: "bg-[#f3ddd3] text-[#8f3f28] border-[#e2b6a5]",
}

const CONCERN_LABELS: Record<GlucoseInsight["concern_level"], string> = {
  Good: "✅ On Track",
  Caution: "⚠️ Needs Attention",
  Elevated: "🔴 Elevated",
}

export function GlucoseInsightSection({
  readings,
  meals,
  mealCount,
}: {
  readings: BloodSugarReading[]
  meals: LoggedMeal[]
  mealCount: number
}) {
  const [insight, setInsight] = useState<GlucoseInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevCountRef = useRef(0)

  useEffect(() => {
    // Re-generate insight when a new meal is analyzed or new reading added
    const total = readings.length + mealCount
    if (total === 0) {
      setInsight(null)
      return
    }
    if (total === prevCountRef.current) return
    prevCountRef.current = total

    setLoading(true)
    setError(null)

    const recentMeals = meals.slice(0, 10).map((m) => ({
      name: m.meal_name,
      time: m.time,
      carbs_g: m.total_net_carbs_g,
      glycemic_load: m.glycemic_load,
    }))

    const readingData = readings.map((r) => ({
      value: r.value,
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      note: r.note,
    }))

    getGlucoseInsightAction(readingData, recentMeals).then((result) => {
      if (result.ok) {
        setInsight(result.data)
      } else {
        setError(result.error)
      }
      setLoading(false)
    })
  }, [readings, meals, mealCount])

  if (readings.length === 0 && mealCount === 0) return null

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
          <Brain className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold text-card-foreground">AI Glucose Insights</h3>
          <p className="text-xs text-muted-foreground">Personalized tips powered by Gemini</p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-secondary/50 px-4 py-8 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">Analyzing your glucose data...</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Gemini is correlating meals with readings</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-[#f3ddd3] px-4 py-3 text-sm text-[#8f3f28]">
            Could not generate insights: {error}
          </div>
        ) : insight ? (
          <div className="space-y-4">
            {/* Concern level badge */}
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
                  CONCERN_STYLES[insight.concern_level],
                )}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {CONCERN_LABELS[insight.concern_level]}
              </span>
            </div>

            {/* Trend summary */}
            {insight.trend_summary && (
              <div className="rounded-2xl bg-secondary px-4 py-3">
                <p className="text-sm leading-relaxed text-secondary-foreground">
                  {insight.trend_summary}
                </p>
              </div>
            )}

            {/* Tips */}
            {insight.tips.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Actionable tips
                </p>
                <ul className="space-y-2">
                  {insight.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-2xl border border-border bg-background p-3.5"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-foreground">{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
