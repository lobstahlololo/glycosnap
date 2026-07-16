"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { UtensilsCrossed } from "lucide-react"
import { DashboardProvider, useDashboardState } from "@/components/dashboard-state"
import type { PersistedState } from "@/components/dashboard-bar"
import { BadgeShelf } from "@/components/badge-shelf"
import { ReportModal } from "@/components/report-modal"
import {
  NAV_ITEMS,
  Sidebar,
  MobileMenuButton,
} from "@/components/sidebar"
import type { ReactNode } from "react"

/**
 * Inner shell — receives state from the provider and renders the chrome.
 * Kept as a separate component so the outer layout can stay a thin wrapper
 * that provides the context.
 *
 * The DashboardBar (gamification pills) intentionally lives INSIDE each page
 * now, so users see: page header text → pills → page content.
 */
function DashboardShell({ children }: { children: ReactNode }) {
  const {
    isMounted,
    persisted,
    setPersisted,
    logs,
    activeModal,
    setActiveModal,
    setEditProfileOpen,
    mobileOpen,
    setMobileOpen,
  } = useDashboardState()
  const pathname = usePathname()
  const router = useRouter()

  const diabetesType = persisted.profile.diabetesType

  const activeId = useMemo(() => {
    // Match the longest nav path that begins with the active pathname.
    const match = NAV_ITEMS
      .filter((item) => item.path === pathname || pathname.startsWith(item.path + "/"))
      .sort((a, b) => b.path.length - a.path.length)[0]
    return match?.id ?? null
  }, [pathname])

  const toggleSidebar = useCallback(() => {
    setPersisted((p: PersistedState) => ({
      ...p,
      ui: { ...p.ui, sidebarExpanded: !p.ui.sidebarExpanded },
    }))
  }, [setPersisted])

  const handleSidebarNavigate = useCallback(
    (href: string) => {
      setMobileOpen(false)
      router.push(href)
    },
    [router, setMobileOpen],
  )

  // Wait until we've hydrated from localStorage so profile-specific UI
  // never clashes with the SSR default render.
  if (!isMounted) return null

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        activeId={activeId}
        collapsed={persisted.ui.sidebarExpanded === false}
        onToggleCollapsed={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onNavigate={handleSidebarNavigate}
        onOpenReport={() => setActiveModal("report")}
        onOpenEditProfile={() => setEditProfileOpen(true)}
        profile={persisted.profile}
        badgeCount={persisted.gamification.unlockedBadges.length}
      />

      {/* ============================================================
          Main column (sidebar uses sticky positioning to the left).
          ============================================================ */}
      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
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

        {children}

        <footer className="mx-auto max-w-5xl px-4 pb-10 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Estimates are AI-generated and for informational purposes only. Always confirm with your
            care team or glucose monitor.
          </p>
        </footer>
      </div>

      {/* Modals — access from any page via the sidebar footer buttons */}
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
          unlocked={persisted.gamification.unlockedBadges}
        />
      )}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  )
}
