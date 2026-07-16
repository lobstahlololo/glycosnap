"use client"

import { HeartPulse } from "lucide-react"
import { useDashboardState } from "@/components/dashboard-state"
import { BloodSugarChart } from "@/components/blood-sugar-chart"
import { BloodSugarInput } from "@/components/blood-sugar-input"

export default function GlucosePage() {
  const { logs, handleBloodSugarAdd } = useDashboardState()
  const hasReadings = logs.readings.length > 0

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <hr className="flex-1 recipe-rule" />
          <span className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <HeartPulse className="h-4 w-4 text-primary" />
            Glucose Tracking
          </span>
          <hr className="flex-1 recipe-rule" />
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-10 lg:grid-cols-2">
        <BloodSugarInput onAdd={handleBloodSugarAdd} />
        {hasReadings ? (
          <BloodSugarChart readings={logs.readings} meals={logs.meals} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
            <HeartPulse className="h-8 w-8 text-primary/40" aria-hidden="true" />
            <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              Log a blood sugar reading and your glucose trend chart will appear here.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
