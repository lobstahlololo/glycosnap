"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import {
  FileText,
  X,
  Printer,
  Calendar,
  HeartPulse,
  UtensilsCrossed,
  Sparkles,
  Activity,
} from "lucide-react"
import type { MealAnalysis, BloodSugarReading } from "@/app/actions"
import type { LoggedMeal } from "@/components/history-log"
import { computeA1cStats, A1C_ZONE_COLORS, A1C_ZONE_LABEL, a1cZone } from "@/lib/a1c"
import { DIABETES_PROFILES, type DiabetesType } from "@/lib/diabetes-profile"

type Period = 7 | 14 | 30

export function ReportModal({
  onClose,
  readings,
  meals,
  diabetesType,
  displayName,
}: {
  onClose: () => void
  readings: BloodSugarReading[]
  meals: LoggedMeal[]
  diabetesType: DiabetesType
  displayName?: string
}) {
  const [periodDays, setPeriodDays] = useState<Period>(14)
  const [glucoseInsightSummary, setGlucoseInsightSummary] = useState<string>("")
  const reportRef = useRef<HTMLDivElement>(null)

  const profile = DIABETES_PROFILES[diabetesType]
  const target = profile.target
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - periodDays)

  const recentReadings = useMemo(
    () =>
      readings
        .filter((r) => new Date(r.timestamp).getTime() >= start.getTime())
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        ),
    [readings, periodDays],
  )

  const recentMeals = useMemo(
    () =>
      meals.slice(0, 12), // simple "recent" — meal logs don't have a date
    [meals],
  )

  const stats = computeA1cStats(readings, diabetesType, periodDays)

  // Lightly summarize glucose data without calling Gemini (PDF needs to work offline-friendly)
  useEffect(() => {
    if (!stats || recentReadings.length === 0) {
      setGlucoseInsightSummary("")
      return
    }
    if (stats.timeInRange >= 80) {
      setGlucoseInsightSummary(
        `Strong control this period — ${Math.round(stats.timeInRange)}% of readings fell within your ${target.low}–${target.high}&nbsp;mg/dL target range (${profile.shortLabel}).`,
      )
    } else if (stats.timeInRange >= 60) {
      setGlucoseInsightSummary(
        `Moderate time-in-range (${Math.round(stats.timeInRange)}%) — a few readings ${stats.timeBelow > stats.timeAbove ? "below" : "above"} the ${target.low}–${target.high}&nbsp;mg/dL band would be worth discussing.`,
      )
    } else {
      setGlucoseInsightSummary(
        `Time-in-range is at ${Math.round(stats.timeInRange)}% — most readings are outside the ${target.low}–${target.high}&nbsp;mg/dL band. Worth a conversation with your care team.`,
      )
    }
  }, [stats, recentReadings.length, target.low, target.high, profile.shortLabel])

  function handlePrint() {
    window.print()
  }

  function handleSavePdf() {
    // Browser's native print dialog has a "Save as PDF" destination
    window.print()
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="report-modal-shell fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm print:static print:block print:bg-white print:p-0"
        onClick={onClose}
      >
        <div
          className="report-modal-card relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl print:max-w-none print:rounded-none print:border-none print:shadow-none"
          onClick={(e) => e.stopPropagation()}
          ref={reportRef}
        >
          {/* Screen header — hidden in print */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-secondary/40 px-6 py-4 print:hidden">
            <div>
              <h2 id="report-title" className="flex items-center gap-2 font-serif text-xl font-semibold text-card-foreground">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                Doctor-Ready Report
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Use <strong>Print</strong> below, then choose &ldquo;Save as PDF&rdquo; in your browser&apos;s dialog.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-card p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Print-friendly content */}
          <div className="px-6 py-6 print:px-8 print:py-6">
            {/* Patient header */}
            <header className="border-b border-border pb-4 print:border-foreground/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    GlycoSnap · Clinical Report
                  </p>
                  <h1 className="mt-1 font-serif text-2xl font-semibold text-foreground print:text-3xl">
                    {displayName || "Patient Summary"}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Profile:&nbsp;
                    <span className="font-semibold text-foreground">
                      {profile.name}
                    </span>
                    &nbsp;· Target range&nbsp;
                    <span className="font-semibold text-foreground">
                      {target.low}–{target.high}&nbsp;mg/dL
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {start.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      &nbsp;–&nbsp;
                      {now.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  <p className="text-[11px] italic text-muted-foreground">
                    Generated by GlycoSnap on&nbsp;
                    {now.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPeriodDays(7)}
                  className={
                    "rounded-full px-3 py-1 font-semibold " +
                    (periodDays === 7
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-card-foreground hover:bg-secondary")
                  }
                >
                  Last 7 days
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodDays(14)}
                  className={
                    "rounded-full px-3 py-1 font-semibold " +
                    (periodDays === 14
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-card-foreground hover:bg-secondary")
                  }
                >
                  Last 14 days
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodDays(30)}
                  className={
                    "rounded-full px-3 py-1 font-semibold " +
                    (periodDays === 30
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-card-foreground hover:bg-secondary")
                  }
                >
                  Last 30 days
                </button>
              </div>
            </header>

            {/* Key numbers */}
            <section className="mt-5 print:break-inside-avoid">
              <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground print:text-xl">
                <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
                Glucose Snapshot
              </h2>
              {stats ? (
                <StatsGrid stats={stats} ideal={profile.a1cTarget.ideal} />
              ) : (
                <p className="mt-3 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
                  Not enough readings in this period to summarize.
                </p>
              )}
            </section>

            {/* Insight summary */}
            {glucoseInsightSummary && (
              <section className="mt-5 print:break-inside-avoid">
                <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground print:text-xl">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  Clinical Note
                </h2>
                <p className="mt-2 rounded-2xl border border-border bg-secondary/50 p-4 text-sm leading-relaxed text-foreground">
                  {glucoseInsightSummary}
                </p>
              </section>
            )}

            {/* Recent readings table */}
            {recentReadings.length > 0 && (
              <section className="mt-5 print:break-inside-avoid">
                <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground print:text-xl">
                  <HeartPulse className="h-4 w-4 text-primary" aria-hidden="true" />
                  Recent Readings ({recentReadings.length})
                </h2>
                <Sparkline readings={recentReadings} low={target.low} high={target.high} />
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-1 font-medium">When</th>
                      <th className="py-1 font-medium">Glucose (mg/dL)</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReadings.slice(-12).reverse().map((r) => {
                      const status =
                        r.value < target.low
                          ? "Below"
                          : r.value > target.high
                            ? "Above"
                            : "In range"
                      return (
                        <tr key={r.id} className="border-b border-border/50">
                          <td className="py-1 text-muted-foreground">
                            {new Date(r.timestamp).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-1 font-semibold tabular-nums text-foreground">
                            {Math.round(r.value)}
                          </td>
                          <td className="py-1 text-muted-foreground">{status}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {/* Recent meals */}
            {recentMeals.length > 0 && (
              <section className="mt-5 print:break-inside-avoid">
                <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground print:text-xl">
                  <UtensilsCrossed className="h-4 w-4 text-primary" aria-hidden="true" />
                  Recent Meals
                </h2>
                <ul className="mt-2 grid gap-1.5">
                  {recentMeals.slice(0, 8).map((m, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-xl bg-background px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-foreground">{m.meal_name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(m.total_calories)} kcal · {Math.round(m.total_net_carbs_g)}g carbs
                      </span>
                      <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                        {m.glycemic_load} GL
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Disclaimer */}
            <footer className="mt-6 border-t border-border pt-3 text-[11px] italic leading-relaxed text-muted-foreground print:break-inside-avoid">
              Estimates are generated from user-logged data and adherence to clinical-grade accuracy
              depends on logging density and device quality. A1c is computed via the ADAG formula
              from logged glucose values. Always confirm readings with the patient&apos;s primary care
              team.
            </footer>
          </div>

          {/* Action bar — hidden in print */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-secondary/40 px-6 py-3 print:hidden">
            <button
              type="button"
              onClick={handleSavePdf}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Save as PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition hover:bg-secondary"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function StatsGrid({
  stats,
  ideal,
}: {
  stats: NonNullable<ReturnType<typeof computeA1cStats>>
  ideal: number
}) {
  const zone = a1cZone(stats, ideal)
  const zoneColor = A1C_ZONE_COLORS[zone]
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-3 print:grid-cols-3">
      <div className="rounded-2xl border border-border bg-background p-4 print:break-inside-avoid">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Estimated A1c
        </p>
        <p className="mt-1 font-serif text-3xl font-semibold tabular-nums text-foreground">
          {stats.estimatedA1c.toFixed(1)}%
        </p>
        <p
          className="mt-1 text-xs font-semibold"
          style={{ color: zoneColor }}
        >
          {A1C_ZONE_LABEL[zone]}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-background p-4 print:break-inside-avoid">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Time-in-Range
        </p>
        <p className="mt-1 font-serif text-3xl font-semibold tabular-nums text-foreground">
          {Math.round(stats.timeInRange)}%
        </p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
          {Math.round(stats.timeBelow)}% below · {Math.round(stats.timeAbove)}% above
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-background p-4 print:break-inside-avoid">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          avg · SD · CV
        </p>
        <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">
          {Math.round(stats.mean)}{" "}
          <span className="text-base font-normal text-muted-foreground">mg/dL</span>
        </p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
          SD {stats.stddev.toFixed(0)} · CV {stats.cv.toFixed(0)}%
        </p>
      </div>
    </div>
  )
}

function Sparkline({
  readings,
  low,
  high,
}: {
  readings: BloodSugarReading[]
  low: number
  high: number
}) {
  if (readings.length < 2) return null
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
  const w = 460
  const h = 80
  const padding = 8
  const values = sorted.map((r) => r.value)
  const min = Math.max(40, Math.min(...values, low) - 10)
  const max = Math.min(400, Math.max(...values, high) + 10)
  const ts = sorted.map((r) => new Date(r.timestamp).getTime())
  const minT = ts[0]
  const maxT = ts[ts.length - 1]
  const range = Math.max(maxT - minT, 1)
  const xFor = (t: number) => padding + ((t - minT) / range) * (w - padding * 2)
  const yFor = (v: number) => padding + (1 - (v - min) / (max - min)) * (h - padding * 2)
  const linePath = sorted
    .map((r, i) => `${i === 0 ? "M" : "L"} ${xFor(new Date(r.timestamp).getTime())} ${yFor(r.value)}`)
    .join(" ")

  const lowY = yFor(low)
  const highY = yFor(high)
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="80"
      preserveAspectRatio="none"
      className="rounded-2xl border border-border bg-background"
    >
      <rect
        x={padding}
        y={highY}
        width={w - padding * 2}
        height={Math.max(0, lowY - highY)}
        fill="oklch(0.58 0.08 150 / 12%)"
      />
      <line x1={padding} x2={w - padding} y1={lowY} y2={lowY} stroke="oklch(0.55 0.10 240 / 60%)" />
      <line x1={padding} x2={w - padding} y1={highY} y2={highY} stroke="oklch(0.55 0.16 32 / 60%)" />
      <path d={linePath} fill="none" stroke="oklch(0.605 0.128 42)" strokeWidth="1.5" />
    </svg>
  )
}
