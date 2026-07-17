"use client"

import { DashboardBar } from "@/components/dashboard-bar"
import { useDashboardBarBindings, useDashboardState } from "@/components/dashboard-state"
import { HistoryLog } from "@/components/history-log"
import { PageHeader } from "@/components/page-header"

export default function HistoryPage() {
  const { logs } = useDashboardState()
  const bar = useDashboardBarBindings()
  return (
    <>
      <PageHeader
        eyebrow="History Log"
        title="Every meal you&apos;ve logged today"
        description="A running list of your analyzed meals. Tap the doctor report in the sidebar for a printable summary you can share with your care team."
      />
      <DashboardBar
        state={bar.state}
        onChange={bar.onChange}
        onOpenBadges={bar.onOpenBadges}
        editOpen={bar.editOpen}
        onCloseEdit={bar.onCloseEdit}
      />
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-12">
        <HistoryLog meals={logs.meals} />
      </div>
    </>
  )
}
