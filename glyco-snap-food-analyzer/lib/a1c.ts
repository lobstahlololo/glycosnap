import { DIABETES_PROFILES, type DiabetesType } from "@/lib/diabetes-profile"

export type A1cStats = {
  /** Number of readings in the window */
  count: number
  /** Mean glucose in mg/dL */
  mean: number
  /** Standard deviation in mg/dL */
  stddev: number
  /** Coefficient of variation (%) */
  cv: number
  /** Estimated A1c from the ADAG study formula in % */
  estimatedA1c: number
  /** Time-in-range percentage (within profile's target band) */
  timeInRange: number
  /** Time above target range percentage */
  timeAbove: number
  /** Time below target range percentage */
  timeBelow: number
  /** Severe hypoglycemia events (<54 mg/dL) */
  hypoEvents: number
  /** Severe hyperglycemia events (>250 mg/dL) */
  hyperEvents: number
  /** Confidence level based on reading density over the window */
  confidence: "low" | "moderate" | "high"
  /** Window covered by the readings, in days (~14 / 30 / 90) */
  windowDays: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Compute estimated A1c + Time-in-Range stats over a recent window of readings.
 *
 * A1c is computed using the ADAG study formula:
 *   eA1c (%) = (mean glucose mg/dL + 46.7) / 28.7
 *
 * Returns null if there's no data.
 */
export function computeA1cStats(
  readings: Array<{ value: number; timestamp: string }>,
  diabetesType: DiabetesType,
  windowDays = 30,
): A1cStats | null {
  if (readings.length === 0) return null

  const target = DIABETES_PROFILES[diabetesType].target
  const cutoff = Date.now() - windowDays * MS_PER_DAY

  const recent = readings
    .filter((r) => new Date(r.timestamp).getTime() >= cutoff)
    .map((r) => r.value)

  if (recent.length === 0) return null

  const n = recent.length
  const mean = recent.reduce((a, b) => a + b, 0) / n
  const variance = recent.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n
  const stddev = Math.sqrt(variance)
  const cv = mean > 0 ? (stddev / mean) * 100 : 0
  const estimatedA1c = (mean + 46.7) / 28.7

  let inRange = 0
  let above = 0
  let below = 0
  let hypo = 0
  let hyper = 0
  for (const v of recent) {
    if (v < target.low) {
      below++
      if (v < 54) hypo++
    } else if (v > target.high) {
      above++
      if (v > 250) hyper++
    } else {
      inRange++
    }
  }

  let confidence: "low" | "moderate" | "high" = "low"
  if (n >= Math.ceil(windowDays * 0.8)) confidence = "high"
  else if (n >= 14) confidence = "moderate"

  return {
    count: n,
    mean,
    stddev,
    cv,
    estimatedA1c,
    timeInRange: (inRange / n) * 100,
    timeAbove: (above / n) * 100,
    timeBelow: (below / n) * 100,
    hypoEvents: hypo,
    hyperEvents: hyper,
    confidence,
    windowDays,
  }
}

export type A1cZone = "excellent" | "good" | "elevated" | "high"

export function a1cZone(stats: A1cStats, ideal: number): A1cZone {
  const a = stats.estimatedA1c
  if (a <= ideal + 0.3) return "excellent"
  if (a <= ideal + 0.7) return "good"
  if (a <= ideal + 1.2) return "elevated"
  return "high"
}

export const A1C_ZONE_COLORS: Record<A1cZone, string> = {
  excellent: "#5a8154",
  good: "#8a7d3a",
  elevated: "#b06a3a",
  high: "#9c4a3a",
}

export const A1C_ZONE_LABEL: Record<A1cZone, string> = {
  excellent: "Excellent control",
  good: "On track",
  elevated: "Slightly above target",
  high: "Discuss with your care team",
}
