"use client"

import { HeartPulse } from "lucide-react"
import { DashboardBar } from "@/components/dashboard-bar"
import { useDashboardBarBindings, useDashboardState } from "@/components/dashboard-state"
import { GlucoseInsightSection } from "@/components/glucose-insight"
import { PageHeader } from "@/components/page-header"

export default function InsightsPage() {
  const { logs } = useDashboardState()
  const bar = useDashboardBarBindings()
  const hasReadings = logs.readings.length > 0

  return (
    <>
      <PageHeader
        eyebrow="Insights &amp; Trends"
        title="What your numbers are telling you"
        description="Recent readings plus an AI-powered summary of patterns between your meals and blood sugar response."
      />
      <DashboardBar
        state={bar.state}
        onChange={bar.onChange}
        onOpenBadges={bar.onOpenBadges}
        editOpen={bar.editOpen}
        onCloseEdit={bar.onCloseEdit}
      />
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-12">
        {hasReadings ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Recent Readings list */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-serif text-xl font-semibold text-card-foreground">
                  <HeartPulse className="h-5 w-5 text-primary" aria-hidden="true" />
                  Recent Readings
                </h3>
                <p className="text-xs text-muted-foreground">
                  Latest:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {Math.round(logs.readings[0].value)}
                  </span>{" "}
                  mg/dL
                </p>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {logs.readings.slice(0, 6).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor:
                            r.value > 180
                              ? "oklch(0.55 0.16 32)"
                              : r.value < 70
                                ? "oklch(0.62 0.12 240)"
                                : "oklch(0.58 0.08 150)",
                        }}
                      >
                        {Math.round(r.value)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {Math.round(r.value)} mg/dL
                        </p>
                        {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI insights */}
            <GlucoseInsightSection
              readings={logs.readings}
              meals={logs.meals}
              mealCount={logs.meals.length}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
            <HeartPulse className="h-8 w-8 text-primary/40" aria-hidden="true" />
            <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              Log a reading or import from your CGM and your personalized AI glucose insights will
              appear here.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
