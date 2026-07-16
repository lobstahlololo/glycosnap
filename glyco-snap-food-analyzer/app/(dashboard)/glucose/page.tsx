"use client"

import { HeartPulse } from "lucide-react"
import { DashboardBar } from "@/components/dashboard-bar"
import { useDashboardBarBindings, useDashboardState } from "@/components/dashboard-state"
import { BloodSugarChart } from "@/components/blood-sugar-chart"
import { BloodSugarInput } from "@/components/blood-sugar-input"
import { PageHeader } from "@/components/page-header"

export default function GlucosePage() {
  const { logs, handleBloodSugarAdd } = useDashboardState()
  const bar = useDashboardBarBindings()
  const hasReadings = logs.readings.length > 0

  return (
    <>
      <PageHeader
        eyebrow="Glucose Tracking"
        title="Log a reading, watch the trend"
        description="Every entry shows up on the chart below. Tap Log Reading to capture mg/dL, optional note, then watch the live trend as the day unfolds."
      />
      <DashboardBar
        state={bar.state}
        onChange={bar.onChange}
        onOpenBadges={bar.onOpenBadges}
        editOpen={bar.editOpen}
        onCloseEdit={bar.onCloseEdit}
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 pt-10 pb-10 lg:grid-cols-2">
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
