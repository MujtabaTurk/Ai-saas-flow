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
import { useDeferredValue, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { AppShellNavigation } from "@/components/i18n/app-shell-navigation";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { DashboardRouteProgress } from "@/components/layout/dashboard-route-progress";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { dashboardNavigation } from "@/config/navigation";
import { UserProfileMenu } from "@/features/auth/components/user-profile-menu";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "serviceflow:dashboard-sidebar-state";
const SIDEBAR_STORAGE_EVENT = "serviceflow:sidebar-state-change";
const DASHBOARD_SEARCH_MIN_LENGTH = 2;
const DASHBOARD_SEARCH_PAGE_SIZE = 5;
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

async function parseDashboardSearchResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || fallbackMessage);
  }

  return payload.data || {};
}

function buildDashboardSearchUrl(path, search) {
  const params = new URLSearchParams({
    page: "1",
    pageSize: String(DASHBOARD_SEARCH_PAGE_SIZE),
    search
  });

  return `${path}?${params.toString()}`;
}

function DashboardSearchResult({ eyebrow, href, meta, onSelect, title }) {
  return (
    <Link
      className="block rounded-lg px-3 py-2 text-start transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={href}
      onClick={onSelect}
    >
      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
        {eyebrow}
      </span>
      <span className="mt-1 block truncate text-sm font-semibold text-foreground">
        {title}
      </span>
      {meta ? (
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {meta}
        </span>
      ) : null}
    </Link>
  );
}

function DashboardSearch() {
  const { t } = useTranslation("common");
  const { data: session } = useSession();
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState({
    bookings: [],
    customers: [],
    query: ""
  });
  const [searchStatus, setSearchStatus] = useState("idle");
  const deferredSearch = useDeferredValue(searchValue.trim());
  const canSearchCustomers =
    session?.user?.platformRole === "SUPER_ADMIN" ||
    ["OWNER", "ADMIN"].includes(session?.user?.businessRole);
  const isCurrentResult = results.query === deferredSearch;
  const visibleResults = isCurrentResult
    ? results
    : { bookings: [], customers: [] };
  const effectiveSearchStatus =
    deferredSearch.length < DASHBOARD_SEARCH_MIN_LENGTH
      ? "idle"
      : isCurrentResult
        ? searchStatus
        : "loading";
  const hasResults =
    visibleResults.bookings.length > 0 || visibleResults.customers.length > 0;
  const showResultsPanel = isFocused && searchValue.length > 0;

  useEffect(() => {
    if (deferredSearch.length < DASHBOARD_SEARCH_MIN_LENGTH) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearchStatus("loading");

      try {
        const bookingsRequest = fetch(
          buildDashboardSearchUrl("/api/bookings", deferredSearch),
          { signal: controller.signal }
        );
        const customersRequest = canSearchCustomers
          ? fetch(buildDashboardSearchUrl("/api/customers", deferredSearch), {
              signal: controller.signal
            })
          : Promise.resolve(null);
        const [bookingsResponse, customersResponse] = await Promise.all([
          bookingsRequest,
          customersRequest
        ]);
        const [bookingsData, customersData] = await Promise.all([
          parseDashboardSearchResponse(
            bookingsResponse,
            t("navigation.dashboardSearchError")
          ),
          customersResponse
            ? parseDashboardSearchResponse(
                customersResponse,
                t("navigation.dashboardSearchError")
              )
            : Promise.resolve({ customers: [] })
        ]);

        setResults({
          bookings: bookingsData.bookings || [],
          customers: customersData.customers || [],
          query: deferredSearch
        });
        setSearchStatus("success");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setResults({ bookings: [], customers: [], query: deferredSearch });
        setSearchStatus("error");
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [canSearchCustomers, deferredSearch, t]);

  function closeResults() {
    setIsFocused(false);
  }

  return (
    <div
      aria-label={t("navigation.dashboardSearch")}
      className="relative hidden w-[min(24rem,42vw)] shrink md:block"
      role="search"
    >
      <Search
        className="pointer-events-none absolute start-3 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        aria-label={t("navigation.dashboardSearch")}
        autoComplete="off"
        className="h-9 w-full rounded-full bg-muted pe-4 ps-10 text-sm font-semibold text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={t("navigation.dashboardSearchPlaceholder")}
        type="search"
        value={searchValue}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 120);
        }}
        onChange={(event) => setSearchValue(event.target.value)}
        onFocus={() => setIsFocused(true)}
      />

      {showResultsPanel ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-growth-border bg-card p-2 shadow-sm">
          {searchValue.trim().length < DASHBOARD_SEARCH_MIN_LENGTH ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t("navigation.dashboardSearchMinLength")}
            </p>
          ) : effectiveSearchStatus === "loading" ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t("navigation.dashboardSearchLoading")}
            </p>
          ) : effectiveSearchStatus === "error" ? (
            <p className="px-3 py-2 text-sm text-[hsl(var(--error-foreground))]">
              {t("navigation.dashboardSearchError")}
            </p>
          ) : hasResults ? (
            <div className="space-y-1">
              {visibleResults.bookings.map((booking) => (
                <DashboardSearchResult
                  eyebrow={t("navigation.bookings")}
                  href="/dashboard/bookings"
                  key={`booking-${booking.id}`}
                  meta={[
                    booking.bookingNumber,
                    booking.customerName,
                    booking.status?.replace("_", " ")
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                  title={booking.serviceNameSnapshot || booking.bookingNumber}
                  onSelect={closeResults}
                />
              ))}
              {visibleResults.customers.map((customer) => (
                <DashboardSearchResult
                  eyebrow={t("navigation.customers")}
                  href={`/dashboard/customers/${customer.id}`}
                  key={`customer-${customer.id}`}
                  meta={[customer.email, customer.phone].filter(Boolean).join(" | ")}
                  title={customer.name}
                  onSelect={closeResults}
                />
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t("navigation.dashboardSearchNoResults")}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function HeaderProfileSkeleton({ className }) {
  const { t } = useTranslation("common");

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center gap-3 rounded-full border border-growth-border bg-card/80 px-3 shadow-sm sm:w-[12rem] sm:justify-start",
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
  const { t } = useTranslation("common");

  if (collapsed) {
    return (
      <Link
        aria-label={workspaceLabel}
        className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href={homeHref}
        onClick={onNavigate}
      >
        <span aria-hidden="true">S</span>
      </Link>
    );
  }

  if (isLoading) {
    return (
      <div
        className="space-y-2"
        role="status"
        aria-label={t("loading.workspace")}
      >
        <span className="sr-only">{t("loading.workspace")}</span>
        <div className="h-6 w-36 animate-pulse rounded-xl bg-primary-mist" />
        <div className="h-3 w-24 animate-pulse rounded-xl bg-primary-mist" />
      </div>
    );
  }

  const brand = (
    <Link
      className="flex min-w-0 items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={homeHref}
      onClick={onNavigate}
    >
      <span
        className="min-w-0 max-w-[11rem] overflow-hidden"
      >
        <span className="block truncate text-xl font-bold leading-7 text-primary">
          {workspaceLabel}
        </span>
        <span className="block truncate text-[10px] font-bold uppercase leading-[15px] tracking-[0.05em] text-serviceflow-muted">
          {t("app.tagline")}
        </span>
      </span>
    </Link>
  );

  return brand;
}

function NotificationBell({ endpoint, href }) {
  const { t } = useTranslation("common");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) setUnread(payload?.data?.unread ?? payload?.data?.summary?.unread ?? 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [endpoint]);

  return (
    <Link
      aria-label={t("navigation.notifications")}
      className="relative inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={href}
    >
      <Bell className="size-4" aria-hidden="true" />
      {unread > 0 ? <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{unread > 99 ? "99+" : unread}</span> : null}
    </Link>
  );
}

function SidebarToggle({ isCollapsed, label, onToggle, tooltipSide }) {
  return (
    <Tooltip content={label} side={tooltipSide}>
      <button
        aria-label={label}
        aria-pressed={isCollapsed}
        className="app-shell-sidebar-toggle group hidden h-11 w-8 items-center justify-center rounded-full border border-growth-border bg-card text-primary shadow-sm hover:border-primary/35 hover:bg-background active:border-primary/50 active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
        type="button"
        onClick={onToggle}
      >
        <span className="absolute inset-y-2 start-1 w-0.5 rounded-full bg-primary/40 opacity-70 transition-[opacity,background-color] duration-200 group-hover:bg-primary/70 group-hover:opacity-100" />
        <span className="relative grid size-6 place-items-center rounded-md bg-primary-mist/80 transition-colors duration-200 group-hover:bg-primary-soft group-active:bg-primary-soft">
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
  showGlobalControls = false,
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
        {showGlobalControls ? (
          <div className="mt-4 border-t border-growth-border/60 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <LanguageSwitcher align="start" />
              <ThemeSwitcher align="start" />
            </div>
          </div>
        ) : null}
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
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-growth-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:shadow-none md:hidden"
          type="button"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="app-shell-mobile-overlay fixed inset-0 z-[80] bg-[hsl(var(--sf-overlay)/0.45)] md:hidden" />
        <DialogPrimitive.Content className="app-shell-mobile-drawer fixed inset-y-0 z-[90] flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden border-e border-growth-border bg-background shadow-sm outline-none md:hidden">
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
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            showGlobalControls
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
      className="app-shell-root min-h-screen bg-background text-foreground"
      data-sidebar-ready={isSidebarReady ? "true" : "false"}
      data-sidebar-state={isSidebarCollapsed ? "collapsed" : "expanded"}
    >
      <DashboardRouteProgress />
      <aside className="app-shell-sidebar fixed inset-y-0 hidden flex-col overflow-visible border-e border-growth-border bg-background md:flex">
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
        <header className="app-shell-header sticky top-0 h-16 border-b border-growth-border/60 bg-background px-4 sm:px-6 lg:px-8">
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
                  className="block truncate text-base font-bold text-foreground transition-colors hover:text-primary md:hidden"
                  href={homeHref}
                >
                  {workspaceLabel}
                </Link>
                <p className="hidden truncate text-sm font-semibold text-serviceflow-muted md:block">
                  {workspaceLabel}
                </p>
              </div>
            </div>
            {homeHref.startsWith("/dashboard") ? <DashboardSearch /> : null}
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden items-center gap-2 md:flex">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
              {isLoading ? (
                <HeaderProfileSkeleton className="md:hidden" />
              ) : (
                <>
                {planLabel ? (
                  <span className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary sm:inline-flex">
                    <Sparkles className="size-4" aria-hidden="true" />
                    {planLabel}
                  </span>
                ) : null}
                {homeHref.startsWith("/dashboard") ? <NotificationBell href="/dashboard/notifications" endpoint="/api/notifications/unread-count" /> : null}
                {homeHref.startsWith("/admin") ? <NotificationBell href="/admin/notifications" endpoint="/api/admin/notifications?unreadOnly=true" /> : null}
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
            className="fixed bottom-6 end-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-[background-color,opacity] hover:bg-primary-hover hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            className="rounded-xl border border-growth-border bg-card p-4 shadow-sm"
            key={index}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-growth-border bg-card p-5 shadow-sm">
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
