import { DIABETES_PROFILES, type DiabetesType } from "@/lib/diabetes-profile"

export type LogKind = "meal" | "reading" | "insight"

/** Award points per log */
export function pointsForLog(kind: LogKind): number {
  switch (kind) {
    case "meal":
      return 10
    case "reading":
      return 5
    case "insight":
      return 2
  }
}

/**
 * Compute the current consecutive-day streak from a list of ISO timestamps.
 * A "day" with at least 1 log counts toward the streak.
 *
 * If today has no logs yet, the streak still counts yesterday — so users
 * don't lose their long streak just because they haven't logged yet today.
 */
export function computeStreak(isoDates: string[]): number {
  if (isoDates.length === 0) return 0
  const dates = new Set(isoDates.map((s) => s.slice(0, 10)))
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let d = new Date(today); streak < 365; d.setDate(d.getDate() - 1)) {
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) {
      streak++
    } else if (streak === 0) {
      // Skip today if no log yet — start counting from yesterday
      continue
    } else {
      break
    }
  }
  return streak
}

/** Award once-per-day streak bonus when a log completes the cycle. */
export function dailyStreakBonus(streak: number): number {
  if (streak >= 30) return 50
  if (streak >= 7) return 25
  if (streak >= 3) return 10
  return 0
}

export type Level = {
  name: string
  minPoints: number
  emoji: string
}

export const LEVELS: Level[] = [
  { name: "Sprout", minPoints: 0, emoji: "🌱" },
  { name: "Tracker", minPoints: 100, emoji: "📒" },
  { name: "Steady", minPoints: 500, emoji: "🪴" },
  { name: "Pro", minPoints: 1500, emoji: "🌳" },
  { name: "Champion", minPoints: 5000, emoji: "🏆" },
]

export function levelFromPoints(points: number): {
  current: Level
  next: Level | null
  progress: number
  toNext: number
} {
  let current = LEVELS[0]
  let next: Level | null = null
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].minPoints) {
      current = LEVELS[i]
      next = LEVELS[i + 1] ?? null
    } else {
      break
    }
  }
  const progress = next
    ? Math.min(1, Math.max(0, (points - current.minPoints) / (next.minPoints - current.minPoints)))
    : 1
  const toNext = next ? next.minPoints - points : 0
  return { current, next, progress, toNext }
}

export type Badge = {
  id: string
  name: string
  description: string
  emoji: string
  category: "milestone" | "consistency" | "health" | "exploration"
  check: (ctx: Ctx) => boolean
}

export type Ctx = {
  readings: { value: number; timestamp: string }[]
  meals: number
  streak: number
  diabetesType: DiabetesType | null
}

function inRangeCount(readings: { value: number }[], type: DiabetesType | null) {
  if (!type) return 0
  const tgt = DIABETES_PROFILES[type].target
  return readings.filter((r) => r.value >= tgt.low && r.value <= tgt.high).length
}

export const BADGES: Badge[] = [
  {
    id: "first-reading",
    name: "First Drop",
    description: "Log your first blood sugar reading.",
    emoji: "💧",
    category: "milestone",
    check: ({ readings }) => readings.length >= 1,
  },
  {
    id: "first-meal",
    name: "Chef's Hat",
    description: "Analyze your first meal.",
    emoji: "👨‍🍳",
    category: "milestone",
    check: ({ meals }) => meals >= 1,
  },
  {
    id: "streak-3",
    name: "Building Habits",
    description: "Log for 3 consecutive days.",
    emoji: "🔥",
    category: "consistency",
    check: ({ streak }) => streak >= 3,
  },
  {
    id: "streak-7",
    name: "Weekly Warrior",
    description: "Log for 7 consecutive days.",
    emoji: "⭐",
    category: "consistency",
    check: ({ streak }) => streak >= 7,
  },
  {
    id: "streak-30",
    name: "Monthly Maven",
    description: "Log for 30 consecutive days.",
    emoji: "🌟",
    category: "consistency",
    check: ({ streak }) => streak >= 30,
  },
  {
    id: "readings-50",
    name: "Data Devotee",
    description: "Log 50 blood sugar readings.",
    emoji: "📊",
    category: "milestone",
    check: ({ readings }) => readings.length >= 50,
  },
  {
    id: "readings-200",
    name: "Glucose Guru",
    description: "Log 200 blood sugar readings.",
    emoji: "🧠",
    category: "milestone",
    check: ({ readings }) => readings.length >= 200,
  },
  {
    id: "healthy-50",
    name: "Sweet Spot",
    description: "50 readings inside your target range.",
    emoji: "🎯",
    category: "health",
    check: (ctx) => inRangeCount(ctx.readings, ctx.diabetesType) >= 50,
  },
  {
    id: "healthy-100",
    name: "Bullseye",
    description: "100 readings inside your target range.",
    emoji: "🏹",
    category: "health",
    check: (ctx) => inRangeCount(ctx.readings, ctx.diabetesType) >= 100,
  },
  {
    id: "analyzer-10",
    name: "Plate Pro",
    description: "Analyze 10 meals.",
    emoji: "🥗",
    category: "exploration",
    check: ({ meals }) => meals >= 10,
  },
]

export function unlockedBadgeIds(ctx: Ctx): string[] {
  return BADGES.filter((b) => b.check(ctx)).map((b) => b.id)
}
