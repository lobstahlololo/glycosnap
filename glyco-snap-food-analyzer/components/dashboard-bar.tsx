"use client"

import { useEffect, useState } from "react"
import { ChevronDown, X, Heart, Sprout, Award } from "lucide-react"
import { BADGES, LEVELS, levelFromPoints } from "@/lib/gamification"
import {
  DEFAULT_PROFILE,
  DIABETES_PROFILES,
  DIABETES_TYPES,
  type DiabetesType,
  type UserProfile,
} from "@/lib/diabetes-profile"

const STORAGE_VERSION = 1
const STORAGE_KEY = "glycosnap_v1"

export type PersistedUI = {
  sidebarExpanded: boolean
}

export type PersistedState = {
  profile: UserProfile
  gamification: { points: number; unlockedBadges: string[] }
  onboarded: boolean
  ui: PersistedUI
}

export const DEFAULT_STATE: PersistedState = {
  profile: DEFAULT_PROFILE,
  gamification: { points: 0, unlockedBadges: [] },
  onboarded: false,
  ui: { sidebarExpanded: true },
}

export function loadPersistedState(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    if (parsed?.version === STORAGE_VERSION && parsed?.state) {
      return {
        ...DEFAULT_STATE,
        ...parsed.state,
        profile: { ...DEFAULT_PROFILE, ...parsed.state.profile },
        gamification: { ...DEFAULT_STATE.gamification, ...parsed.state.gamification },
        ui: { ...DEFAULT_STATE.ui, ...(parsed.state.ui ?? {}) },
      }
    }
  } catch {}
  return DEFAULT_STATE
}

export function persistState(s: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, state: s }))
  } catch {}
}

export function DashboardBar({
  state,
  onChange,
  onOpenBadges,
  editOpen,
  onCloseEdit,
}: {
  state: PersistedState
  onChange: (next: PersistedState) => void
  onOpenBadges: () => void
  /** Controlled profile-edit modal. Page passes `true` when triggered from sidebar. */
  editOpen: boolean
  onCloseEdit: () => void
}) {
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  // First-time onboarding — auto-opens once
  useEffect(() => {
    if (!state.onboarded) setOnboardingOpen(true)
  }, [state.onboarded])

  const level = levelFromPoints(state.gamification.points)
  const earnedCount = state.gamification.unlockedBadges.length
  const profile = DIABETES_PROFILES[state.profile.diabetesType]

  function commitProfile(diabetesType: DiabetesType) {
    onChange({
      ...state,
      profile: { ...state.profile, diabetesType },
      onboarded: true,
    })
    setOnboardingOpen(false)
    onCloseEdit()
  }

  return (
    <>
      {/* Top strip — gamification only. Profile + Report live in the sidebar. */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 pt-2 pb-1 sm:pt-3">
        <Pill icon={<Heart className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}>
          <span className="tabular-nums font-semibold text-foreground">{state.gamification.points}</span>
          <span className="text-muted-foreground">&nbsp;Insight Score</span>
        </Pill>

        <Pill tone="accent">
          <span className="text-base leading-none" aria-hidden="true">
            {level.current.emoji}
          </span>
          <span className="font-semibold text-foreground">{level.current.name}</span>
          {level.next ? (
            <span className="text-muted-foreground">
              &nbsp;·&nbsp;<span className="tabular-nums">{level.toNext}</span>&nbsp;to&nbsp;next
            </span>
          ) : null}
        </Pill>

        <button
          type="button"
          onClick={onOpenBadges}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-card-foreground shadow-sm transition hover:bg-secondary"
        >
          <Award className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="tabular-nums">{earnedCount}</span>
          <span className="text-muted-foreground">/ {BADGES.length}&nbsp;badges</span>
        </button>
      </div>

      {/* Onboarding modal */}
      {onboardingOpen && (
        <ModalShell title="Welcome to GlycoSnap" onClose={() => setOnboardingOpen(false)}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To personalize your healthy glucose range and recommendations, please share which best
            describes your journey. You can change this anytime from the sidebar.
          </p>
          <ul className="mt-4 grid gap-2">
            {DIABETES_TYPES.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => commitProfile(t)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border bg-background p-4 text-left transition hover:border-ring hover:bg-secondary"
                >
                  <span className="text-xl" aria-hidden="true">
                    {DIABETES_PROFILES[t].emoji}
                  </span>
                  <div className="flex-1">
                    <p className="font-serif text-base font-semibold text-foreground">
                      {DIABETES_PROFILES[t].name}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {DIABETES_PROFILES[t].description}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Target range:&nbsp;
                      <span className="font-semibold text-foreground">
                        {DIABETES_PROFILES[t].target.low}–{DIABETES_PROFILES[t].target.high}&nbsp;mg/dL
                      </span>
                      &nbsp;· Ideal A1c:&nbsp;
                      <span className="font-semibold text-foreground">
                        {DIABETES_PROFILES[t].a1cTarget.ideal}%
                      </span>
                    </p>
                  </div>
                  <ChevronDown className="-rotate-90 self-center text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </ModalShell>
      )}

      {/* Edit modal — controlled by parent (sidebar triggers it) */}
      {editOpen && (
        <ModalShell
          title="Your health profile"
          onClose={onCloseEdit}
          subtitle={state.profile.displayName ?? "Anonymous"}
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            Choose the profile that best matches your current situation. Recommended ranges and A1c
            targets will update across the whole dashboard.
          </p>
          <ul className="mt-4 grid gap-2">
            {DIABETES_TYPES.map((t) => {
              const isCurrent = t === state.profile.diabetesType
              return (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => commitProfile(t)}
                    className={
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition " +
                      (isCurrent
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-ring hover:bg-secondary")
                    }
                  >
                    <span className="text-xl" aria-hidden="true">
                      {DIABETES_PROFILES[t].emoji}
                    </span>
                    <div className="flex-1">
                      <p className="font-serif text-base font-semibold text-foreground">
                        {DIABETES_PROFILES[t].name}
                        {isCurrent && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {DIABETES_PROFILES[t].description}
                      </p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Target: {DIABETES_PROFILES[t].target.low}–{DIABETES_PROFILES[t].target.high}{" "}
                        mg/dL · Ideal A1c: {DIABETES_PROFILES[t].a1cTarget.ideal}%
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </ModalShell>
      )}

      {/* Spacer so onboarding content has scroll margin */}
      <span id="dashboard-strip-bottom" aria-hidden="true" />
    </>
  )
}

function Pill({
  children,
  icon,
  tone,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  tone?: "accent"
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs shadow-sm " +
        (tone === "accent"
          ? "bg-accent text-accent-foreground"
          : "border border-border bg-card text-card-foreground")
      }
    >
      {icon}
      {children}
    </span>
  )
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border bg-secondary/40 px-6 py-4">
          <div>
            <h2 id="modal-title" className="font-serif text-xl font-semibold text-card-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
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
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export { LEVELS }
