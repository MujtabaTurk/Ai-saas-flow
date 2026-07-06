"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Bell,
  CalendarPlus,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AppShellNavigation } from "@/components/i18n/app-shell-navigation";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { DashboardRouteProgress } from "@/components/layout/dashboard-route-progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { dashboardNavigation } from "@/config/navigation";
import { UserProfileMenu } from "@/features/auth/components/user-profile-menu";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "serviceflow:dashboard-sidebar-state";
const SIDEBAR_STORAGE_EVENT = "serviceflow:sidebar-state-change";
let sidebarStateFallback = "expanded";

function normalizeSidebarState(value) {
  return value === "collapsed" ? "collapsed" : "expanded";
}

function getSidebarStateSnapshot() {
  if (typeof window === "undefined") {
    return sidebarStateFallback;
  }

  try {
    return normalizeSidebarState(
      window.localStorage.getItem(SIDEBAR_STORAGE_KEY) || sidebarStateFallback
    );
  } catch {
    return sidebarStateFallback;
  }
}

function getSidebarServerSnapshot() {
  return "expanded";
}

function subscribeSidebarState(onStoreChange) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SIDEBAR_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SIDEBAR_STORAGE_EVENT, onStoreChange);
  };
}

function writeSidebarState(nextState) {
  sidebarStateFallback = normalizeSidebarState(nextState);

  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarStateFallback);
  } catch {
    // The sidebar still works if persistence is blocked.
  }

  window.dispatchEvent(new Event(SIDEBAR_STORAGE_EVENT));
}

function HeaderProfileSkeleton({ className }) {
  const { t } = useTranslation("common");

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center gap-3 rounded-full border border-[#c7c4d8] bg-white/80 px-3 shadow-sm dark:border-white/10 dark:bg-white/5 sm:w-[12rem] sm:justify-start",
        className
      )}
      role="status"
      aria-label={t("loading.accountMenu")}
    >
      <Skeleton className="size-9 rounded-2xl" />
      <div className="hidden min-w-0 flex-1 space-y-2 sm:block">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function SidebarBrand({
  collapsed = false,
  homeHref,
  isLoading,
  onNavigate,
  workspaceLabel
}) {
  const { i18n, t } = useTranslation("common");
  const tooltipSide = i18n.dir() === "rtl" ? "left" : "right";

  if (isLoading) {
    return (
      <div
        className={cn("space-y-2", collapsed && "flex flex-col items-center")}
        role="status"
        aria-label={t("loading.workspace")}
      >
        <span className="sr-only">{t("loading.workspace")}</span>
        <div
          className={cn(
            "animate-pulse rounded-xl bg-[#e5eeff]",
            collapsed ? "size-10" : "h-6 w-36"
          )}
        />
        {!collapsed ? <div className="h-3 w-24 animate-pulse rounded-xl bg-[#e5eeff]" /> : null}
      </div>
    );
  }

  const brand = (
    <Link
      aria-label={collapsed ? workspaceLabel : undefined}
      className={cn(
        "flex min-w-0 items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30",
        collapsed && "justify-center"
      )}
      href={homeHref}
      onClick={onNavigate}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#3525cd] text-white">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <span
        aria-hidden={collapsed}
        className={cn(
          "min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-200",
          collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-[11rem] translate-x-0 opacity-100"
        )}
      >
        <span className="block truncate text-xl font-bold leading-7 text-[#3525cd]">
          {workspaceLabel}
        </span>
        <span className="block truncate text-[10px] font-bold uppercase leading-[15px] tracking-[0.05em] text-[#464555]">
          {t("app.tagline")}
        </span>
      </span>
    </Link>
  );

  return collapsed ? (
    <Tooltip content={workspaceLabel} side={tooltipSide}>
      {brand}
    </Tooltip>
  ) : (
    brand
  );
}

function SidebarToggle({ isCollapsed, label, onToggle, tooltipSide }) {
  return (
    <Tooltip content={label} side={tooltipSide}>
      <button
        aria-label={label}
        aria-pressed={isCollapsed}
        className="app-shell-sidebar-toggle group hidden h-11 w-8 items-center justify-center rounded-full border border-[#c7c4d8]/80 bg-white/80 text-[#3525cd] shadow-[0_18px_35px_-24px_rgba(11,28,48,0.65),0_0_0_1px_rgba(255,255,255,0.55)_inset] backdrop-blur-md hover:border-[#3525cd]/35 hover:bg-[#f8f9ff]/95 hover:shadow-[0_18px_38px_-20px_rgba(53,37,205,0.45),0_0_0_1px_rgba(255,255,255,0.7)_inset] active:border-[#3525cd]/50 active:bg-[#e5eeff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f9ff] md:inline-flex"
        type="button"
        onClick={onToggle}
      >
        <span className="absolute inset-y-2 start-1 w-0.5 rounded-full bg-[#3525cd]/40 opacity-70 transition-[opacity,background-color] duration-200 group-hover:bg-[#3525cd]/70 group-hover:opacity-100" />
        <span className="relative grid size-6 place-items-center rounded-md bg-[#e5eeff]/80 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset] transition-colors duration-200 group-hover:bg-[#d5e0f8] group-active:bg-[#d5e0f8]">
          <PanelLeftClose
            className={cn(
              "absolute size-3.5 transition-[opacity,transform] duration-200",
              isCollapsed
                ? "-translate-x-1 scale-75 opacity-0"
                : "translate-x-0 scale-100 opacity-100"
            )}
            aria-hidden="true"
          />
          <PanelLeftOpen
            className={cn(
              "absolute size-3.5 transition-[opacity,transform] duration-200",
              isCollapsed
                ? "translate-x-0 scale-100 opacity-100"
                : "translate-x-1 scale-75 opacity-0"
            )}
            aria-hidden="true"
          />
        </span>
      </button>
    </Tooltip>
  );
}

function SidebarContent({
  closeButton = null,
  homeHref,
  isCollapsed = false,
  isLoading,
  navigation,
  onNavigate,
  onToggleCollapsed,
  showProfile = false,
  workspaceLabel
}) {
  const { i18n, t } = useTranslation("common");
  const tooltipSide = i18n.dir() === "rtl" ? "left" : "right";
  const collapseLabel = t(
    isCollapsed ? "navigation.expandSidebar" : "navigation.collapseSidebar"
  );

  return (
    <>
      {onToggleCollapsed ? (
        <SidebarToggle
          isCollapsed={isCollapsed}
          label={collapseLabel}
          onToggle={onToggleCollapsed}
          tooltipSide={tooltipSide}
        />
      ) : null}
      <div
        className={cn(
          "shrink-0 px-4 pb-8 pt-8 transition-[padding] duration-200",
          isCollapsed && "px-3 pb-6"
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center justify-between gap-4",
            isCollapsed && "flex-col justify-center gap-3"
          )}
        >
          <div className="min-w-0">
            <SidebarBrand
              collapsed={isCollapsed}
              homeHref={homeHref}
              isLoading={isLoading}
              onNavigate={onNavigate}
              workspaceLabel={workspaceLabel}
            />
          </div>
          {closeButton}
        </div>
      </div>
      <ScrollArea
        className={cn(
          "min-h-0 flex-1 px-4 transition-[padding] duration-200",
          isCollapsed && "px-3"
        )}
        scrollHideDelay={350}
        type="hover"
      >
        <AppShellNavigation
          ariaLabel={t("navigation.workspace", { workspace: workspaceLabel })}
          collapsed={isCollapsed}
          isLoading={isLoading}
          navigation={navigation}
          onNavigate={onNavigate}
        />
      </ScrollArea>
      <div
        className={cn(
          "shrink-0 px-4 pb-8 pt-4 transition-[padding] duration-200",
          isCollapsed && "px-3 pb-5"
        )}
      >
        <AppShellNavigation
          ariaLabel={t("navigation.primary")}
          collapsed={isCollapsed}
          isLoading={isLoading}
          navigation={navigation}
          onNavigate={onNavigate}
          placement="footer"
        />
        {showProfile ? (
          <div
            className={cn(
              "mt-4 border-t border-growth-border/60 pt-4",
              isCollapsed && "mt-3 pt-3"
            )}
          >
            <UserProfileMenu
              className={cn(isCollapsed && "flex justify-center")}
              compact={isCollapsed}
              layout="sidebar"
              menuAlign="end"
              menuSide={tooltipSide}
              tooltipSide={tooltipSide}
              variant={homeHref.startsWith("/admin") ? "admin" : "workspace"}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

function MobileSidebarDrawer({
  homeHref,
  isLoading,
  navigation,
  onNavigate,
  onOpenChange,
  open,
  workspaceLabel
}) {
  const { t, i18n } = useTranslation("common");

  return (
    <DialogPrimitive.Root dir={i18n.dir()} open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={t("navigation.openSidebar")}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#c7c4d8] bg-white text-[#0b1c30] shadow-sm transition-colors hover:bg-[#e5eeff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 md:hidden"
          type="button"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="app-shell-mobile-overlay fixed inset-0 z-[80] bg-[#0b1c30]/45 backdrop-blur-sm md:hidden" />
        <DialogPrimitive.Content className="app-shell-mobile-drawer fixed inset-y-0 z-[90] flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden border-e border-[#c7c4d8] bg-[#f8f9ff] shadow-2xl outline-none md:hidden">
          <DialogPrimitive.Title className="sr-only">
            {t("navigation.workspace", { workspace: workspaceLabel })}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t("navigation.sidebarDescription")}
          </DialogPrimitive.Description>
          <SidebarContent
            closeButton={
              <DialogPrimitive.Close asChild>
                <button
                  aria-label={t("navigation.closeSidebar")}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#464555] transition-colors hover:bg-[#e5eeff] hover:text-[#3525cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30"
                  type="button"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </DialogPrimitive.Close>
            }
            homeHref={homeHref}
            isLoading={isLoading}
            navigation={navigation}
            onNavigate={onNavigate}
            workspaceLabel={workspaceLabel}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function AppShell({
  children,
  isLoading = false,
  navigation = dashboardNavigation,
  planLabel = null,
  workspaceLabel = "ServiceFlow"
}) {
  const { t } = useTranslation("common");
  const homeHref = navigation?.[0]?.href || "/dashboard";
  const pathname = usePathname();
  const sidebarState = useSyncExternalStore(
    subscribeSidebarState,
    getSidebarStateSnapshot,
    getSidebarServerSnapshot
  );
  const isSidebarCollapsed = sidebarState === "collapsed";
  const [isSidebarReady, setIsSidebarReady] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsSidebarReady(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    function handleMediaChange(event) {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    }

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  function toggleDesktopSidebar() {
    writeSidebarState(isSidebarCollapsed ? "expanded" : "collapsed");
  }

  return (
    <div
      className="app-shell-root min-h-screen bg-[#f8f9ff] text-[#0b1c30] dark:bg-background"
      data-sidebar-ready={isSidebarReady ? "true" : "false"}
      data-sidebar-state={isSidebarCollapsed ? "collapsed" : "expanded"}
    >
      <DashboardRouteProgress />
      <aside className="app-shell-sidebar fixed inset-y-0 hidden flex-col overflow-visible border-e border-[#c7c4d8] bg-[#f8f9ff] md:flex">
        <SidebarContent
          homeHref={homeHref}
          isCollapsed={isSidebarCollapsed}
          isLoading={isLoading}
          navigation={navigation}
          onToggleCollapsed={toggleDesktopSidebar}
          showProfile
          workspaceLabel={workspaceLabel}
        />
      </aside>
      <main className="app-shell-main">
        <header className="app-shell-header sticky top-0 h-16 border-b border-[#c7c4d8] bg-[#f8f9ff]/80 px-4 shadow-sm backdrop-blur-[6px] dark:border-white/10 dark:bg-card/90 sm:px-6 lg:px-8">
          <div className="flex h-full w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <MobileSidebarDrawer
                homeHref={homeHref}
                isLoading={isLoading}
                navigation={navigation}
                onNavigate={closeMobileSidebar}
                onOpenChange={setIsMobileSidebarOpen}
                open={isMobileSidebarOpen}
                workspaceLabel={workspaceLabel}
              />
              <div className="min-w-0">
                <Link
                  className="block truncate text-base font-bold text-[#0b1c30] transition-colors hover:text-[#3525cd] dark:text-white md:hidden"
                  href={homeHref}
                >
                  {workspaceLabel}
                </Link>
                <p className="hidden truncate text-sm font-semibold text-[#464555] md:block">
                  {workspaceLabel}
                </p>
              </div>
            </div>
            <div
              aria-label={t("navigation.dashboardSearch")}
              className="relative hidden w-[min(24rem,42vw)] shrink md:block"
              role="search"
            >
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-[18px] -translate-y-1/2 text-[#6b7280]"
                aria-hidden="true"
              />
              <div className="flex h-9 items-center rounded-full bg-[#eff4ff] pe-4 ps-10 text-sm font-semibold text-[#6b7280]">
                {t("navigation.dashboardSearchPlaceholder")}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <LanguageSwitcher />
              {isLoading ? (
                <HeaderProfileSkeleton className="md:hidden" />
              ) : (
                <>
                {planLabel ? (
                  <span className="hidden items-center gap-2 rounded-full border border-[#4f46e5]/20 bg-[#4f46e5]/10 px-4 py-2 text-sm font-semibold text-[#4f46e5] sm:inline-flex">
                    <Sparkles className="size-4" aria-hidden="true" />
                    {planLabel}
                  </span>
                ) : null}
                {homeHref.startsWith("/dashboard") ? (
                  <Link
                    aria-label={t("navigation.notifications")}
                    className="relative inline-flex size-9 items-center justify-center rounded-full text-[#0b1c30] transition-colors hover:bg-[#e5eeff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30"
                    href="/dashboard/notifications"
                  >
                    <Bell className="size-4" aria-hidden="true" />
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" />
                  </Link>
                ) : null}
                <UserProfileMenu
                  className="md:hidden"
                  variant={homeHref.startsWith("/admin") ? "admin" : "workspace"}
                />
                </>
              )}
            </div>
          </div>
        </header>
        <div
          className="mx-auto w-full max-w-[1180px] p-4 motion-safe:animate-shell-page-in sm:p-6 lg:p-8"
          key={pathname}
        >
          {children}
        </div>
        {homeHref.startsWith("/dashboard") ? (
          <Link
            aria-label={t("navigation.quickBooking")}
            className="fixed bottom-6 end-6 z-40 flex size-14 items-center justify-center rounded-full bg-[#3525cd] text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition hover:bg-[#2c1ea9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30 focus-visible:ring-offset-2"
            href="/dashboard/bookings"
            title={t("navigation.quickBooking")}
          >
            <CalendarPlus className="size-6" aria-hidden="true" />
          </Link>
        ) : null}
      </main>
    </div>
  );
}

export function AppShellPageSkeleton() {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-6" role="status" aria-label={t("loading.dashboard")}>
      <span className="sr-only">{t("loading.dashboard")}</span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-xl border border-growth-border bg-white p-4 shadow-sm dark:border-white/10 dark:bg-card"
            key={index}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-growth-border bg-white p-5 shadow-sm dark:border-white/10 dark:bg-card">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-3 h-3 w-64 max-w-full" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="flex items-center gap-3" key={index}>
              <Skeleton className="size-10 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
