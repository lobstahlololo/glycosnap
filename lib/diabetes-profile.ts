export type DiabetesType = "type1" | "type2" | "gestational" | "prediabetes"

export type TargetRange = {
  /** Lower bound of healthy range in mg/dL */
  low: number
  /** Upper bound of healthy range in mg/dL */
  high: number
  /** Human-readable label */
  label: string
  /** Contextual note for the patient */
  context: string
}

export type DiabetesProfile = {
  name: string
  shortLabel: string
  description: string
  /** Recommended daytime glucose range */
  target: TargetRange
  /** Recommended A1c window (%) */
  a1cTarget: { low: number; high: number; ideal: number }
  emoji: string
  accent: string
}

export const DIABETES_PROFILES: Record<DiabetesType, DiabetesProfile> = {
  type1: {
    name: "Type 1 Diabetes",
    shortLabel: "Type 1",
    description:
      "Insulin-dependent. Typically requires frequent monitoring (4-10×/day) and carb counting.",
    target: { low: 80, high: 180, label: "Daytime range", context: "ADA/AACE consensus for most adults with Type 1" },
    a1cTarget: { low: 6.5, high: 7.0, ideal: 6.5 },
    emoji: "🟦",
    accent: "#5b8fb8",
  },
  type2: {
    name: "Type 2 Diabetes",
    shortLabel: "Type 2",
    description:
      "Often managed with diet, exercise, oral meds, and/or insulin. Targets are individualised.",
    target: { low: 80, high: 180, label: "Daytime range", context: "Standard AACE/ADA range" },
    a1cTarget: { low: 6.5, high: 7.5, ideal: 7.0 },
    emoji: "🟩",
    accent: "#6fa362",
  },
  gestational: {
    name: "Gestational Diabetes",
    shortLabel: "Gestational",
    description:
      "Diabetes during pregnancy. Targets are tighter for fetal safety (fasting <95, 1-hr post <140).",
    target: { low: 63, high: 140, label: "Pregnancy target", context: "Strict targets to support healthy fetal outcomes" },
    a1cTarget: { low: 6.0, high: 6.5, ideal: 6.0 },
    emoji: "🌸",
    accent: "#c47a92",
  },
  prediabetes: {
    name: "Prediabetes",
    shortLabel: "Prediabetes",
    description:
      "Above normal but below the diabetes threshold. Focus on prevention and tight control.",
    target: { low: 70, high: 140, label: "Tight range", context: "Prevention-oriented target band" },
    a1cTarget: { low: 5.5, high: 6.0, ideal: 5.7 },
    emoji: "🟨",
    accent: "#c8a946",
  },
}

export const DIABETES_TYPES = Object.keys(DIABETES_PROFILES) as DiabetesType[]

export type UserProfile = {
  diabetesType: DiabetesType
  /** Optional display name for the doctor report */
  displayName?: string
}

export const DEFAULT_PROFILE: UserProfile = {
  diabetesType: "type2",
}
