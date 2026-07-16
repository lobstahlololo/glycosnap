"use client"

import { useDashboardState } from "@/components/dashboard-state"
import { DeviceSync } from "@/components/device-sync"

export default function DevicesPage() {
  const { handleCsvImport } = useDashboardState()
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <p className="eyebrow">Device Sync</p>
        <h2 className="mt-2 text-balance font-serif text-3xl font-semibold leading-tight text-foreground">
          Connect your CGM or meter
        </h2>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Import readings from Dexcom, FreeStyle Libre, Eversense, Accu-Chek, OneTouch, or any
          generic CSV. CSV import is fully working today — OAuth partner credentials are
          required for live connections.
        </p>
      </div>
      <DeviceSync onImport={handleCsvImport} />
    </div>
  )
}
