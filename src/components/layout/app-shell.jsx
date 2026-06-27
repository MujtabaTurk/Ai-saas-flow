import Link from "next/link";
import { AppShellNavigation } from "@/components/i18n/app-shell-navigation";
import { DashboardRouteProgress } from "@/components/layout/dashboard-route-progress";
import { dashboardNavigation } from "@/config/navigation";
import { UserProfileMenu } from "@/features/auth/components/user-profile-menu";

export function AppShell({
  children,
  navigation = dashboardNavigation,
  workspaceLabel = "ServiceFlow"
}) {
  const homeHref = navigation?.[0]?.href || "/dashboard";

  return (
    <div className="min-h-screen bg-growth-dashboard dark:bg-background">
      <DashboardRouteProgress />
      <aside className="app-shell-sidebar fixed inset-y-0 left-0 hidden w-64 bg-growth-sidebar p-6 text-growth-border lg:block">
        <div className="text-lg font-bold text-white">{workspaceLabel}</div>
        <AppShellNavigation navigation={navigation} />
      </aside>
      <main className="app-shell-main lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-growth-border bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/90 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <Link
                className="block truncate text-base font-bold text-growth-sidebar dark:text-white lg:hidden"
                href={homeHref}
              >
                {workspaceLabel}
              </Link>
              <p className="hidden truncate text-sm font-semibold text-muted-foreground lg:block">
                {workspaceLabel}
              </p>
            </div>
            <UserProfileMenu variant={homeHref.startsWith("/admin") ? "admin" : "workspace"} />
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
