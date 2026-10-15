"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { BloodSugarReading, MealAnalysis } from "@/app/actions"
import {
  DashboardBar,
  DEFAULT_STATE,
  loadPersistedState,
  persistState,
  type PersistedState,
} from "@/components/dashboard-bar"
import type { LoggedMeal } from "@/components/history-log"
import {
  computeStreak,
  dailyStreakBonus,
  pointsForLog,
  unlockedBadgeIds,
} from "@/lib/gamification"

/**
 * Logs (meals + readings) live under a separate localStorage key from the
 * persisted profile/gamification so they can be migrated independently.
 */
const LOGS_STORAGE_KEY = "glycosnap_logs_v1"

export type LogsState = {
  meals: LoggedMeal[]
  readings: BloodSugarReading[]
}

type ActiveModal = "none" | "badges" | "report"

type DashboardContextValue = {
  isMounted: boolean
  persisted: PersistedState
  setPersisted: (next: PersistedState | ((prev: PersistedState) => PersistedState)) => void
  logs: LogsState
  handleAnalyzed: (data: MealAnalysis) => void
  handleBloodSugarAdd: (reading: BloodSugarReading) => void
  handleCsvImport: (importedReadings: BloodSugarReading[]) => void
  /** Award the once-per-day insight points (+2) after a successful AI insight. */
  awardInsightPoints: () => void
  activeModal: ActiveModal
  setActiveModal: (next: ActiveModal) => void
  editProfileOpen: boolean
  setEditProfileOpen: (next: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (next: boolean) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

/** Today's date key (YYYY-MM-DD) — matches how computeStreak slices timestamps. */
function dateKey(): string {
  return new Date().toISOString().slice(0, 10)
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

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  const [persisted, setPersistedState] = useState<PersistedState>(DEFAULT_STATE)
  const [logs, setLogs] = useState<LogsState>({ meals: [], readings: [] })
  const [activeModal, setActiveModal] = useState<ActiveModal>("none")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)

  // Hydrate exactly once on mount (avoids React 19 SSR hydration mismatches)
  useEffect(() => {
    setPersistedState(loadPersistedState())
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

  // Stable wrapper that accepts either a value or a functional updater so
  // pages can do `setPersisted(p => ({ ...p, foo }))` without rewiring.
  const setPersisted = useCallback(
    (next: PersistedState | ((prev: PersistedState) => PersistedState)) => {
      setPersistedState((prev) =>
        typeof next === "function" ? (next as (p: PersistedState) => PersistedState)(prev) : next,
      )
    },
    [],
  )

  /**
   * Apply gamification *synchronously* against the post-update log arrays.
   * This runs once per user-initiated event — including bulk CSV import —
   * so 5,000 imported readings still produce a single badge evaluation.
   */
  const advanceGamification = useCallback(
    (
      kind: "meal" | "reading" | "csv",
      count: number,
      newLogs: LogsState,
    ): Partial<PersistedState> => {
      const basePoints = pointsForLog(kind === "csv" ? "reading" : kind) * count
      const streak = computeStreak(newLogs.readings.map((r) => r.timestamp))
      const ctx = {
        readings: newLogs.readings,
        meals: newLogs.meals.length,
        streak,
        diabetesType: persisted.profile.diabetesType,
      }
      // Streak bonus: +10 at 3 days, +25 at 7, +50 at 30 — granted at most
      // once per day so re-logging can't farm it.
      const today = dateKey()
      const bonus = dailyStreakBonus(streak)
      const bonusEarned = bonus > 0 && persisted.gamification.lastStreakBonusDate !== today
      return {
        gamification: {
          points:
            persisted.gamification.points + basePoints + (bonusEarned ? bonus : 0),
          unlockedBadges: unlockedBadgeIds(ctx),
          lastStreakBonusDate: bonusEarned ? today : persisted.gamification.lastStreakBonusDate,
          lastInsightDate: persisted.gamification.lastInsightDate,
        },
      }
    },
    [persisted],
  )

  /**
   * Award the insight log's +2 points once per calendar day, after Gemini
   * returns an insight successfully (see GlucoseInsightSection).
   */
  const awardInsightPoints = useCallback(() => {
    setPersistedState((p) => {
      const today = dateKey()
      if (p.gamification.lastInsightDate === today) return p
      return {
        ...p,
        gamification: {
          ...p.gamification,
          points: p.gamification.points + pointsForLog("insight"),
          lastInsightDate: today,
        },
      }
    })
  }, [])

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
        setPersistedState((p) => ({
          ...p,
          ...advanceGamification("meal", 1, next),
        }))
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
        setPersistedState((p) => ({
          ...p,
          ...advanceGamification("reading", 1, next),
        }))
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
        setPersistedState((p) => ({
          ...p,
          ...advanceGamification("csv", importedReadings.length, next),
        }))
        return next
      })
    },
    [advanceGamification],
  )

  const value = useMemo<DashboardContextValue>(
    () => ({
      isMounted,
      persisted,
      setPersisted,
      logs,
      handleAnalyzed,
      handleBloodSugarAdd,
      handleCsvImport,
      awardInsightPoints,
      activeModal,
      setActiveModal,
      editProfileOpen,
      setEditProfileOpen,
      mobileOpen,
      setMobileOpen,
    }),
    [
      isMounted,
      persisted,
      setPersisted,
      logs,
      handleAnalyzed,
      handleBloodSugarAdd,
      handleCsvImport,
      awardInsightPoints,
      activeModal,
      editProfileOpen,
      mobileOpen,
    ],
  )

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  )
}

/**
 * Read dashboard state from any child page/layout. Throws if used outside
 * the provider (i.e. forgetting to wrap a tree).
 */
export function useDashboardState(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error("useDashboardState must be used inside <DashboardProvider>")
  }
  return ctx
}

/**
 * Convenience hook for the dashboard bar that needs its own props but uses
 * the same state. Wrapped here so callers don't have to repeat the bindings.
 */
export function useDashboardBarBindings() {
  const {
    persisted,
    setPersisted,
    setActiveModal,
    editProfileOpen,
    setEditProfileOpen,
  } = useDashboardState()
  return {
    state: persisted,
    onChange: setPersisted,
    onOpenBadges: () => setActiveModal("badges"),
    editOpen: editProfileOpen,
    onCloseEdit: () => setEditProfileOpen(false),
  }
}

// Re-export for callers that need the bar's modal inside their own page.
export { DashboardBar }
