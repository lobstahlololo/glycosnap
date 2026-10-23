"use client"

import { DashboardBar } from "@/components/dashboard-bar"
import { useDashboardBarBindings, useDashboardState } from "@/components/dashboard-state"
import { DeviceSync } from "@/components/device-sync"
import { PageHeader } from "@/components/page-header"

export default function DevicesPage() {
  const { handleCsvImport } = useDashboardState()
  const bar = useDashboardBarBindings()
  return (
    <>
      <PageHeader
        eyebrow="Device Sync"
        title="Connect your CGM or meter"
        description="Import readings from Dexcom, FreeStyle Libre, Eversense, Accu-Chek, OneTouch, or any generic CSV."
      />
      <DashboardBar
        state={bar.state}
        onChange={bar.onChange}
        onOpenBadges={bar.onOpenBadges}
        editOpen={bar.editOpen}
        onCloseEdit={bar.onCloseEdit}
      />
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-12">
        <DeviceSync onImport={handleCsvImport} />
      </div>
    </>
  )
}
