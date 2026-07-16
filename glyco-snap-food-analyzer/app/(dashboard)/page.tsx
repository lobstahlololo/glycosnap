"use client"

import { UtensilsCrossed } from "lucide-react"
import { useDashboardState } from "@/components/dashboard-state"
import { MealAnalyzer } from "@/components/meal-analyzer"
import { ResultCard } from "@/components/result-card"

export default function NewEntryPage() {
  const { logs, handleAnalyzed } = useDashboardState()
  const latest = logs.meals[0] ?? null

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div>
          <p className="eyebrow">Today&apos;s entry</p>
          <h2 className="mt-2 text-balance font-serif text-4xl font-semibold leading-tight text-foreground">
            What did you eat?
          </h2>
          <hr className="recipe-rule my-4 max-w-24" />
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Snap a photo or describe your meal. GlycoSnap gently estimates carbs, protein,
            fat, and blood-sugar impact in seconds.
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
  )
}
