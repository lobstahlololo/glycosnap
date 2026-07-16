"use client"

import { useDashboardState } from "@/components/dashboard-state"
import { A1cCard } from "@/components/a1c-card"

export default function A1cPage() {
  const { logs, persisted } = useDashboardState()
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <p className="eyebrow">A1c Snapshot</p>
        <h2 className="mt-2 text-balance font-serif text-3xl font-semibold leading-tight text-foreground">
          Estimated A1c &amp; Time-in-Range
        </h2>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
          A reading of your last 30 days of glucose data using the ADAG formula.
          Logging more readings (or importing from your CGM) sharpens the estimate.
        </p>
      </div>
      <A1cCard readings={logs.readings} diabetesType={persisted.profile.diabetesType} />
    </div>
  )
}
