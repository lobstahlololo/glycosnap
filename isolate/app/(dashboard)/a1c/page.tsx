"use client"

import { DashboardBar } from "@/components/dashboard-bar"
import { useDashboardBarBindings, useDashboardState } from "@/components/dashboard-state"
import { A1cCard } from "@/components/a1c-card"
import { PageHeader } from "@/components/page-header"

export default function A1cPage() {
  const { logs, persisted } = useDashboardState()
  const bar = useDashboardBarBindings()
  return (
    <>
      <PageHeader
        eyebrow="A1c Snapshot"
        title="Estimated A1c &amp; Time-in-Range"
        description="A reading of your last 30 days of glucose data using the ADAG formula. Logging more readings (or importing from your CGM) sharpens the estimate."
      />
      <DashboardBar
        state={bar.state}
        onChange={bar.onChange}
        onOpenBadges={bar.onOpenBadges}
        editOpen={bar.editOpen}
        onCloseEdit={bar.onCloseEdit}
      />
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-12">
        <A1cCard readings={logs.readings} diabetesType={persisted.profile.diabetesType} />
      </div>
    </>
  )
}
