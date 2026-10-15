import { History } from "lucide-react"
import type { MealAnalysis } from "@/app/actions"
import { GlycemicBadge } from "@/components/glycemic-badge"

export type LoggedMeal = MealAnalysis & { id: string; time: string }

export function HistoryLog({ meals }: { meals: LoggedMeal[] }) {
  const totalCarbs = meals.reduce((sum, m) => sum + m.total_net_carbs_g, 0)
  const totalCalories = meals.reduce((sum, m) => sum + m.total_calories, 0)

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_30px_-12px_rgba(120,80,50,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-card-foreground">
          <History className="h-5 w-5 text-primary" aria-hidden="true" />
          Today&apos;s History
        </h2>
        {meals.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {Math.round(totalCalories)}
            </span>{" "}
            kcal ·{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {Math.round(totalCarbs)}g
            </span>{" "}
            net carbs
          </p>
        ) : null}
      </div>

      {meals.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No meals logged yet. Analyzed meals will appear here automatically.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {meals.map((meal) => (
            <li
              key={meal.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{meal.meal_name}</p>
                <p className="text-xs text-muted-foreground">{meal.time}</p>
              </div>
              <div className="flex items-center gap-4 text-sm tabular-nums text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">
                    {Math.round(meal.total_calories)}
                  </span>{" "}
                  kcal
                </span>
                <span>
                  <span className="font-semibold text-foreground">
                    {Math.round(meal.total_net_carbs_g)}g
                  </span>{" "}
                  carbs
                </span>
              </div>
              <GlycemicBadge level={meal.glycemic_load} className="text-xs" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
