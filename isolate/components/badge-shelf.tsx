"use client"

import { Award, X, Lock, Slash } from "lucide-react"
import { BADGES } from "@/lib/gamification"

const CATEGORY_LABELS: Record<string, { name: string; emoji: string }> = {
  milestone: { name: "Milestones", emoji: "🌱" },
  consistency: { name: "Consistency", emoji: "🌿" },
  health: { name: "Healthy Glycemic Range", emoji: "🍃" },
  exploration: { name: "Exploration of Plates", emoji: "🍵" },
}

const CATEGORY_ORDER = ["milestone", "consistency", "health", "exploration"] as const

export function BadgeShelf({
  unlocked,
  onClose,
}: {
  unlocked: string[]
  onClose: () => void
}) {
  const unlockedSet = new Set(unlocked)
  const earnedCount = unlocked.length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border bg-secondary/40 px-6 py-4">
          <div>
            <h2 id="badge-title" className="flex items-center gap-2 font-serif text-xl font-semibold text-card-foreground">
              <Award className="h-5 w-5 text-primary" aria-hidden="true" />
              Your Badge Shelf
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Quiet milestones for showing up consistently. {earnedCount} of {BADGES.length} earned.
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

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {CATEGORY_ORDER.map((category) => {
            const items = BADGES.filter((b) => b.category === category)
            if (items.length === 0) return null
            const cat = CATEGORY_LABELS[category]
            return (
              <section key={category} className="mb-6 last:mb-0">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <span aria-hidden="true">{cat.emoji}</span>
                  {cat.name}
                </h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {items.map((badge) => {
                    const earned = unlockedSet.has(badge.id)
                    return (
                      <li
                        key={badge.id}
                        className={
                          "flex items-start gap-3 rounded-2xl border p-3.5 " +
                          (earned
                            ? "border-accent bg-accent/30"
                            : "border-border bg-background opacity-70")
                        }
                      >
                        <span
                          className={
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm " +
                            (earned ? "bg-card" : "bg-secondary grayscale")
                          }
                          aria-hidden="true"
                        >
                          {earned ? badge.emoji : <Slash className="h-5 w-5 text-muted-foreground" />}
                        </span>
                        <div className="flex-1">
                          <p
                            className={
                              "font-serif text-sm font-semibold " +
                              (earned ? "text-foreground" : "text-muted-foreground")
                            }
                          >
                            {badge.name}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {badge.description}
                          </p>
                          {!earned && (
                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Lock className="h-3 w-3" aria-hidden="true" />
                              Locked
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>

        <div className="border-t border-border bg-secondary/40 px-6 py-3 text-center text-xs text-muted-foreground">
          Badges reward showing up — not perfect numbers. Your care team has the final word.
        </div>
      </div>
    </div>
  )
}
