"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { UtensilsCrossed, HeartPulse } from "lucide-react"
import type { MealAnalysis, BloodSugarReading } from "@/app/actions"
import { MealAnalyzer } from "@/components/meal-analyzer"
import { ResultCard } from "@/components/result-card"
import { HistoryLog, type LoggedMeal } from "@/components/history-log"
import { BloodSugarInput } from "@/components/blood-sugar-input"
import { BloodSugarChart } from "@/components/blood-sugar-chart"
import { GlucoseInsightSection } from "@/components/glucose-insight"
import { A1cCard } from "@/components/a1c-card"
import { DeviceSync } from "@/components/device-sync"
import { BadgeShelf } from "@/components/badge-shelf"
import { ReportModal } from "@/components/report-modal"
import {
  DashboardBar,
  DEFAULT_STATE,
  loadPersistedState,
  persistState,
  type PersistedState,
} from "@/components/dashboard-bar"
import {
  Sidebar,
  MobileMenuButton,
  NAV_ITEMS,
  type SidebarSectionId,
} from "@/components/sidebar"
import { computeStreak, pointsForLog, unlockedBadgeIds } from "@/lib/gamification"

/**
 * Stored as a separate key from profile/gamification so that the latter
 * can be migrated independently of the user's log history.
 */
const LOGS_STORAGE_KEY = "glycosnap_logs_v1"

type LogsState = {
  meals: LoggedMeal[]
  readings: BloodSugarReading[]
}

function loadLogs(): LogsState {
  if (typeof window === "undefined") return { meals: [], readings: [] }
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY)
    if (!raw) return { meals: [], readings: [] }
    const parsed = JSON.parse(raw)
    return {
      meals: Array.isArray(parsed?.meals) ? parsed.meals : [],
      readings: Array.isArray(parsed?.readings) ? parsed.readings : [],
    }
  } catch {
    return { meals: [], readings: [] }
  }
}

function saveLogs(logs: LogsState) {
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs))
  } catch {}
}

type ActiveModal = "none" | "badges" | "report"

export default function Page() {
  const [isMounted, setIsMounted] = useState(false)
  const [persisted, setPersisted] = useState<PersistedState>(DEFAULT_STATE)
  const [logs, setLogs] = useState<LogsState>({ meals: [], readings: [] })
  const [activeModal, setActiveModal] = useState<ActiveModal>("none")

  // Sidebar: collapsed persists via persisted.ui.sidebarExpanded;
  // mobileOpen is session-only (resets on reload).
  const [mobileOpen, setMobileOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [activeSection, setActiveSection] =
    useState<SidebarSectionId>("section-new-entry")

  // Hydrate exactly once on mount (avoids React 19 SSR hydration mismatches)
  useEffect(() => {
    const loaded = loadPersistedState()
    setPersisted(loaded)
    setLogs(loadLogs())
    setIsMounted(true)
  }, [])

  // Persist profile/gamification/ui whenever _and only after_ mounted
  useEffect(() => {
    if (isMounted) persistState(persisted)
  }, [persisted, isMounted])

  // Persist meal/reading logs
  useEffect(() => {
    if (isMounted) saveLogs(logs)
  }, [logs, isMounted])

  // Scroll spy — IntersectionObserver watches the 6 anchored sections and
  // updates activeSection as the user scrolls. Root margin narrows the
  // "active band" to roughly the middle 20% of the viewport.
  useEffect(() => {
    if (!isMounted) return
    const els = NAV_ITEMS
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        // Pick the visible section whose top is closest to (but not past)
        // the top of the viewport — feels like the section the user is reading.
        const sorted = [...visible].sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        )
        const next = sorted[0].target.id as SidebarSectionId
        setActiveSection((prev) => (prev === next ? prev : next))
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isMounted])

  /**
   * Apply gamification *synchronously* against the post-update log arrays.
   * This runs once per user-initiated event — including bulk CSV import —
   * so 5,000 imported readings still produce a single badge evaluation.
   */
  const advanceGamification = useCallback(
    (_kind: "meal" | "reading" | "csv", count: number, newLogs: LogsState): Partial<PersistedState> => {
      const pointsDelta = pointsForLog(_kind === "csv" ? "reading" : _kind) * count
      const streak = computeStreak(newLogs.readings.map((r) => r.timestamp))
      const ctx = {
        readings: newLogs.readings,
        meals: newLogs.meals.length,
        streak,
        diabetesType: persisted.profile.diabetesType,
      }
      // pointsDelta may be 0 for csv (no-op on points); streak is computed
      // every time so any new reading extends the chain.
      void streak
      return {
        gamification: {
          points: persisted.gamification.points + pointsDelta,
          unlockedBadges: unlockedBadgeIds(ctx),
        },
      }
    },
    [persisted],
  )

  const handleAnalyzed = useCallback(
    (data: MealAnalysis) => {
      setLogs((prev) => {
        const newMeal: LoggedMeal = {
          ...data,
          id: crypto.randomUUID(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }
        const next: LogsState = {
          readings: prev.readings,
          meals: [newMeal, ...prev.meals],
        }
        setPersisted((p) => ({ ...p, ...advanceGamification("meal", 1, next) }))
        return next
      })
    },
    [advanceGamification],
  )

  const handleBloodSugarAdd = useCallback(
    (reading: BloodSugarReading) => {
      setLogs((prev) => {
        const nextReadings = [reading, ...prev.readings].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        const next: LogsState = { meals: prev.meals, readings: nextReadings }
        setPersisted((p) => ({ ...p, ...advanceGamification("reading", 1, next) }))
        return next
      })
    },
    [advanceGamification],
  )

  const handleCsvImport = useCallback(
    (importedReadings: BloodSugarReading[]) => {
      setLogs((prev) => {
        // De-dupe by timestamp+value, sort newest-first, then evaluate once.
        const seen = new Set<string>()
        const merged: BloodSugarReading[] = []
        for (const r of [...importedReadings, ...prev.readings]) {
          const key = `${r.timestamp}|${r.value}`
          if (!seen.has(key)) {
            seen.add(key)
            merged.push(r)
          }
        }
        const nextReadings = merged.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        const next: LogsState = { meals: prev.meals, readings: nextReadings }
        setPersisted((p) => ({
          ...p,
          ...advanceGamification("csv", importedReadings.length, next),
        }))
        return next
      })
    },
    [advanceGamification],
  )

  const handleNavigate = useCallback((id: SidebarSectionId) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    setActiveSection(id)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setPersisted((p) => ({
      ...p,
      ui: { ...p.ui, sidebarExpanded: !p.ui.sidebarExpanded },
    }))
  }, [])

  const latest = logs.meals[0] ?? null
  const hasAnyBloodSugar = logs.readings.length > 0
  const diabetesType = persisted.profile.diabetesType

  const activeUnlockedBadges = useMemo(
    () => persisted.gamification.unlockedBadges,
    [persisted.gamification.unlockedBadges],
  )

  const sidebarCollapsed = persisted.ui.sidebarExpanded === false

  // Don't render until we've hydrated from localStorage to avoid React 19
  // hydration mismatches (profile-specific UI vs. SSR-rendered default UI).
  if (!isMounted) return null

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenReport={() => setActiveModal("report")}
        onOpenEditProfile={() => setEditProfileOpen(true)}
        profile={persisted.profile}
        badgeCount={persisted.gamification.unlockedBadges.length}
      />

      {/* ============================================================
          Main column (sidebar uses sticky positioning to the left).
          ============================================================ */}
      <div className="min-w-0 flex-1">
        {/* Mobile top bar (hidden on lg+) */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/70 bg-card/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/70 lg:hidden">
          <MobileMenuButton open={mobileOpen} onOpen={() => setMobileOpen(true)} />
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-base font-semibold text-foreground">
              GlycoSnap
            </h1>
            <p className="truncate text-[11px] italic text-muted-foreground">
              A cozy journal
            </p>
          </div>
        </div>

        {/* Dashboard gamification strip (above content, below header) */}
        <DashboardBar
          state={persisted}
          onChange={setPersisted}
          onOpenBadges={() => setActiveModal("badges")}
          editOpen={editProfileOpen}
          onCloseEdit={() => setEditProfileOpen(false)}
        />

        <main>
          {/* ============================================================
              SECTION — New Entry (meal analyzer + latest result)
              ============================================================ */}
          <section id="section-new-entry" className="scroll-mt-20">
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
          </section>

          {/* ============================================================
              SECTION — Glucose Tracking (input + chart)
              ============================================================ */}
          <section id="section-glucose" className="scroll-mt-20">
            <div className="mx-auto max-w-5xl px-4 pb-4 pt-2">
              <div className="flex items-center gap-3">
                <hr className="flex-1 recipe-rule" />
                <span className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  Glucose Tracking
                </span>
                <hr className="flex-1 recipe-rule" />
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-8 lg:grid-cols-2">
              <BloodSugarInput onAdd={handleBloodSugarAdd} />
              {hasAnyBloodSugar ? (
                <BloodSugarChart readings={logs.readings} meals={logs.meals} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
                  <HeartPulse className="h-8 w-8 text-primary/40" aria-hidden="true" />
                  <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
                    Log a blood sugar reading and your glucose trend chart will appear here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ============================================================
              SECTION — A1c Snapshot
              ============================================================ */}
          <section id="section-a1c" className="scroll-mt-20">
            <div className="mx-auto max-w-5xl px-4 pb-8">
              <A1cCard readings={logs.readings} diabetesType={diabetesType} />
            </div>
          </section>

          {/* ============================================================
              SECTION — Insights & Trends (recent readings + AI)
              ============================================================ */}
          <section id="section-insights" className="scroll-mt-20">
            {hasAnyBloodSugar ? (
              <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-8 lg:grid-cols-2">
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

                <GlucoseInsightSection
                  readings={logs.readings}
                  meals={logs.meals}
                  mealCount={logs.meals.length}
                />
              </div>
            ) : (
              <div className="mx-auto max-w-5xl px-4 pb-8">
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
                  <HeartPulse className="h-8 w-8 text-primary/40" aria-hidden="true" />
                  <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                    Log a reading or import from your CGM and your personalized AI glucose insights
                    will appear here.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ============================================================
              SECTION — Device Sync
              ============================================================ */}
          <section id="section-devices" className="scroll-mt-20">
            <div className="mx-auto max-w-5xl px-4 pb-8">
              <DeviceSync onImport={handleCsvImport} />
            </div>
          </section>

          {/* ============================================================
              SECTION — History Log
              ============================================================ */}
          <section id="section-history" className="scroll-mt-20">
            <div className="mx-auto max-w-5xl px-4 pb-12">
              <HistoryLog meals={logs.meals} />
            </div>
          </section>
        </main>

        <footer className="mx-auto max-w-5xl px-4 pb-10 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Estimates are AI-generated and for informational purposes only. Always confirm with your
            care team or glucose monitor.
          </p>
        </footer>
      </div>

      {activeModal === "report" && (
        <ReportModal
          onClose={() => setActiveModal("none")}
          readings={logs.readings}
          meals={logs.meals}
          diabetesType={diabetesType}
          displayName={persisted.profile.displayName}
        />
      )}

      {activeModal === "badges" && (
        <BadgeShelf
          onClose={() => setActiveModal("none")}
          unlocked={activeUnlockedBadges}
        />
      )}
    </div>
  )
}
