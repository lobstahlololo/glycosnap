"use client"

import { useState, useCallback } from "react"
import { UtensilsCrossed, HeartPulse } from "lucide-react"
import type { MealAnalysis, BloodSugarReading } from "@/app/actions"
import { MealAnalyzer } from "@/components/meal-analyzer"
import { ResultCard } from "@/components/result-card"
import { HistoryLog, type LoggedMeal } from "@/components/history-log"
import { BloodSugarInput } from "@/components/blood-sugar-input"
import { BloodSugarChart } from "@/components/blood-sugar-chart"
import { GlucoseInsightSection } from "@/components/glucose-insight"

export default function Page() {
  const [latest, setLatest] = useState<MealAnalysis | null>(null)
  const [history, setHistory] = useState<LoggedMeal[]>([])
  const [bloodSugarReadings, setBloodSugarReadings] = useState<BloodSugarReading[]>([])

  function handleAnalyzed(data: MealAnalysis) {
    setLatest(data)
    setHistory((prev) => [
      {
        ...data,
        id: crypto.randomUUID(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...prev,
    ])
  }

  const handleBloodSugarAdd = useCallback((reading: BloodSugarReading) => {
    setBloodSugarReadings((prev) => [reading, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
  }, [])

  const hasData = bloodSugarReadings.length > 0 || history.length > 0

  return (
    <main className="min-h-screen">
      <header className="border-b border-border/70 bg-card/50">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-card-foreground">
              GlycoSnap
            </h1>
            <p className="font-serif text-sm italic text-muted-foreground">
              A cozy journal for every meal you make
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl gap-8 px-4 py-10 lg:grid-cols-2">
        {/* Top: Meal entry + result */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div>
              <p className="eyebrow">Today&apos;s entry</p>
              <h2 className="mt-2 text-balance font-serif text-4xl font-semibold leading-tight text-foreground">
                What did you eat?
              </h2>
              <hr className="recipe-rule my-4 max-w-24" />
              <p className="text-pretty leading-relaxed text-muted-foreground">
                Snap a photo or describe your meal. GlycoSnap gently estimates carbs, protein, fat,
                and blood-sugar impact in seconds.
              </p>
            </div>
            <MealAnalyzer onAnalyzed={handleAnalyzed} />
          </div>

          <div className="flex flex-col gap-6">
            {latest ? (
              <ResultCard data={latest} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="max-w-xs text-pretty leading-relaxed text-muted-foreground">
                  Your meal breakdown will appear here, served warm, after analysis.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Blood Sugar Tracker */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <hr className="flex-1 recipe-rule" />
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <HeartPulse className="h-4 w-4 text-primary" />
              Glucose Tracking
            </span>
            <hr className="flex-1 recipe-rule" />
          </div>

          <BloodSugarInput onAdd={handleBloodSugarAdd} />

          {hasData && (
            <BloodSugarChart readings={bloodSugarReadings} meals={history} />
          )}

          {hasData && (
            <GlucoseInsightSection
              readings={bloodSugarReadings}
              meals={history}
              mealCount={history.length}
            />
          )}
        </div>

        {/* Recent readings quick-view */}
        {bloodSugarReadings.length > 0 && (
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-serif text-xl font-semibold text-card-foreground">
                <HeartPulse className="h-5 w-5 text-primary" aria-hidden="true" />
                Recent Readings
              </h3>
              <p className="text-xs text-muted-foreground">
                Latest: <span className="font-semibold tabular-nums text-foreground">{Math.round(bloodSugarReadings[0].value)}</span> mg/dL
              </p>
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {bloodSugarReadings.slice(0, 6).map((r) => (
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
                      {r.note && (
                        <p className="text-xs text-muted-foreground">{r.note}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* History Log */}
        <div className="mt-8">
          <HistoryLog meals={history} />
        </div>
      </div>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Estimates are AI-generated and for informational purposes only. Always confirm with your
          care team or glucose monitor.
        </p>
      </footer>
    </main>
  )
}
