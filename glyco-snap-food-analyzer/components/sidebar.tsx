"use client"

import { useEffect } from "react"
import {
  UtensilsCrossed,
  HeartPulse,
  Activity,
  Sparkles,
  BookOpen,
  UploadCloud,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Settings2,
  X,
  Menu,
} from "lucide-react"
import {
  DIABETES_PROFILES,
  type UserProfile,
} from "@/lib/diabetes-profile"
import { cn } from "@/lib/utils"

export type SidebarSectionId =
  | "section-new-entry"
  | "section-glucose"
  | "section-a1c"
  | "section-insights"
  | "section-history"
  | "section-devices"

type NavItem = {
  id: SidebarSectionId
  label: string
  shortLabel: string
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "section-new-entry",
    label: "New Entry",
    shortLabel: "New",
    Icon: UtensilsCrossed,
  },
  {
    id: "section-glucose",
    label: "Glucose Tracking",
    shortLabel: "Glucose",
    Icon: HeartPulse,
  },
  {
    id: "section-a1c",
    label: "A1c Snapshot",
    shortLabel: "A1c",
    Icon: Activity,
  },
  {
    id: "section-insights",
    label: "Insights & Trends",
    shortLabel: "Insights",
    Icon: Sparkles,
  },
  {
    id: "section-history",
    label: "History Log",
    shortLabel: "History",
    Icon: BookOpen,
  },
  {
    id: "section-devices",
    label: "Device Sync",
    shortLabel: "Devices",
    Icon: UploadCloud,
  },
]

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  activeSection,
  onNavigate,
  onOpenReport,
  onOpenEditProfile,
  profile,
  badgeCount,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  activeSection: SidebarSectionId
  onNavigate: (id: SidebarSectionId) => void
  onOpenReport: () => void
  onOpenEditProfile: () => void
  profile: UserProfile
  badgeCount: number
}) {
  const profileMeta = DIABETES_PROFILES[profile.diabetesType]

  // Esc closes the mobile drawer
  useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseMobile()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileOpen, onCloseMobile])

  function handleNavClick(id: SidebarSectionId) {
    onNavigate(id)
    // Close mobile drawer on selection
    if (mobileOpen) onCloseMobile()
  }

  return (
    <>
      {/* ============================================================
          MOBILE: hamburger toggle (rendered separately by parent
          via the MobileMenuButton export). Here we only render the
          drawer + backdrop.
          ============================================================ */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      />

      {/* ============================================================
          MOBILE DRAWER (full-width slide-in)
          ============================================================ */}
      <aside
        id="sidebar-nav"
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <MobileDrawerContents
          navItems={NAV_ITEMS}
          activeSection={activeSection}
          onNavClick={handleNavClick}
          onCloseMobile={onCloseMobile}
          onOpenReport={() => {
            onOpenReport()
            onCloseMobile()
          }}
          onOpenEditProfile={() => {
            onOpenEditProfile()
            onCloseMobile()
          }}
          profile={profile}
          profileMeta={profileMeta}
          badgeCount={badgeCount}
        />
      </aside>

      {/* ============================================================
          DESKTOP persistent sidebar (collapsible rail)
          ============================================================ */}
      <aside
        id="sidebar-nav-desktop"
        aria-label="Primary navigation"
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out lg:block",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand + collapse toggle */}
          <div
            className={cn(
              "flex items-center border-b border-sidebar-border px-3 py-5",
              collapsed ? "flex-col gap-3" : "flex-row justify-between",
            )}
          >
            {!collapsed && (
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-serif text-base font-semibold text-sidebar-foreground">
                    GlycoSnap
                  </p>
                  <p className="truncate font-serif text-[11px] italic text-muted-foreground">
                    A cozy journal
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-expanded={!collapsed}
              aria-controls="sidebar-nav-desktop"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                        collapsed ? "justify-center" : "text-left",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                        )}
                        aria-hidden={true}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition group-hover:opacity-100">
                          {item.label}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer: profile + report */}
          <div className="border-t border-sidebar-border px-3 py-3">
            <ul className="flex flex-col gap-1">
              <li>
                <button
                  type="button"
                  onClick={onOpenReport}
                  title={collapsed ? "Doctor Report" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95",
                    collapsed ? "justify-center" : "text-left",
                  )}
                >
                  <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">Doctor Report</span>}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenEditProfile}
                  title={
                    collapsed
                      ? `${profileMeta.name} · ${profileMeta.target.low}–${profileMeta.target.high} mg/dL`
                      : undefined
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border border-sidebar-border bg-card px-3 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-secondary",
                    collapsed ? "justify-center" : "text-left",
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base" aria-hidden="true">
                    {profileMeta.emoji}
                  </span>
                  {!collapsed && (
                    <span className="flex min-w-0 flex-1 flex-col text-left">
                      <span className="truncate font-semibold">{profileMeta.shortLabel}</span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {profileMeta.target.low}–{profileMeta.target.high} mg/dL
                      </span>
                    </span>
                  )}
                  {!collapsed && (
                    <Settings2
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
              {!collapsed && (
                <li className="mt-2 px-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  {badgeCount} of 10 badges earned
                </li>
              )}
            </ul>
          </div>
        </div>
      </aside>
    </>
  )
}

/** Hamburger button shown on mobile/tablet to open the drawer. */
export function MobileMenuButton({
  open,
  onOpen,
}: {
  open: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={open ? "Close navigation" : "Open navigation"}
      aria-expanded={open}
      aria-controls="sidebar-nav"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition hover:bg-secondary lg:hidden"
    >
      <Menu className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}

/** ============================================================
    Internal: Mobile drawer contents
    ============================================================ */
function MobileDrawerContents({
  navItems,
  activeSection,
  onNavClick,
  onCloseMobile,
  onOpenReport,
  onOpenEditProfile,
  profile,
  profileMeta,
  badgeCount,
}: {
  navItems: NavItem[]
  activeSection: SidebarSectionId
  onNavClick: (id: SidebarSectionId) => void
  onCloseMobile: () => void
  onOpenReport: () => void
  onOpenEditProfile: () => void
  profile: UserProfile
  profileMeta: (typeof DIABETES_PROFILES)[keyof typeof DIABETES_PROFILES]
  badgeCount: number
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-serif text-base font-semibold text-sidebar-foreground">
              GlycoSnap
            </p>
            <p className="font-serif text-[11px] italic text-muted-foreground">
              A cozy journal
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sidebar-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sections">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavClick(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-primary-foreground" : "text-muted-foreground",
                    )}
                    aria-hidden={true}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={onOpenReport}
              className="flex w-full items-center gap-3 rounded-2xl bg-primary px-3 py-3 text-left text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95"
            >
              <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate">Doctor Report</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="flex w-full items-center gap-3 rounded-2xl border border-sidebar-border bg-card px-3 py-3 text-left text-sm font-medium text-card-foreground shadow-sm transition hover:bg-secondary"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base" aria-hidden="true">
                {profileMeta.emoji}
              </span>
              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="truncate font-semibold">{profileMeta.shortLabel}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {profileMeta.target.low}–{profileMeta.target.high} mg/dL
                </span>
              </span>
              <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </li>
          <li className="mt-2 px-1.5 text-[10px] leading-relaxed text-muted-foreground">
            {profile.displayName
              ? `Signed in as ${profile.displayName}`
              : `Anonymous · ${badgeCount} of 10 badges earned`}
          </li>
        </ul>
      </div>
    </div>
  )
}

export { NAV_ITEMS }
