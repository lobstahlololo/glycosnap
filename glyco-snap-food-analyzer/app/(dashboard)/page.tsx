"use client"

import { UtensilsCrossed } from "lucide-react"
import { DashboardBar } from "@/components/dashboard-bar"
import { useDashboardBarBindings, useDashboardState } from "@/components/dashboard-state"
import { MealAnalyzer } from "@/components/meal-analyzer"
import { PageHeader } from "@/components/page-header"
import { ResultCard } from "@/components/result-card"

export default function NewEntryPage() {
  const { logs, handleAnalyzed } = useDashboardState()
  const bar = useDashboardBarBindings()
  const latest = logs.meals[0] ?? null

  return (
    <>
      <PageHeader
        eyebrow="Today&apos;s entry"
        title="What did you eat?"
        description="Snap a photo or describe your meal. GlycoSnap gently estimates carbs, protein, fat, and blood-sugar impact in seconds."
      />
      <DashboardBar
        state={bar.state}
        onChange={bar.onChange}
        onOpenBadges={bar.onOpenBadges}
        editOpen={bar.editOpen}
        onCloseEdit={bar.onCloseEdit}
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 pt-12 pb-10 lg:grid-cols-2">
        <MealAnalyzer onAnalyzed={handleAnalyzed} />
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
    </>
  )
}
