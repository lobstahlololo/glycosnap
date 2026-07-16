"use client"

import { useDashboardState } from "@/components/dashboard-state"
import { HistoryLog } from "@/components/history-log"

export default function HistoryPage() {
  const { logs } = useDashboardState()
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <p className="eyebrow">History Log</p>
        <h2 className="mt-2 text-balance font-serif text-3xl font-semibold leading-tight text-foreground">
          Every meal you&apos;ve logged today
        </h2>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
          A running list of your analyzed meals. Tap the doctor report in the sidebar for a
          printable summary you can share with your care team.
        </p>
      </div>
      <HistoryLog meals={logs.meals} />
    </div>
  )
}
