import { AppShellNavigation } from "@/components/i18n/app-shell-navigation";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { dashboardNavigation } from "@/config/navigation";

export function AppShell({
  children,
  navigation = dashboardNavigation,
  workspaceLabel = "ServiceFlow"
}) {
  return (
    <div className="min-h-screen bg-growth-dashboard">
      <aside className="app-shell-sidebar fixed inset-y-0 left-0 hidden w-64 bg-growth-sidebar p-6 text-growth-border lg:block">
        <div className="text-lg font-bold text-white">{workspaceLabel}</div>
        <AppShellNavigation navigation={navigation} />
        <div className="absolute bottom-6 left-6 right-6 text-growth-border">
          <LanguageSwitcher />
        </div>
      </aside>
      <main className="app-shell-main lg:pl-64">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
