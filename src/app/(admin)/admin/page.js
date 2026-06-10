import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { adminNavigation } from "@/config/navigation";
import { SuperAdminDashboard } from "@/features/admin/components/super-admin-dashboard";
import { getSuperAdminMetrics } from "@/features/admin/metrics";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { isSuperAdmin } from "@/features/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata = {
  title: "Admin | ServiceFlow"
};

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isSuperAdmin(session.user)) {
    redirect("/dashboard");
  }

  const metrics = await getSuperAdminMetrics();

  return (
    <AppShell navigation={adminNavigation} workspaceLabel="ServiceFlow Admin">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Platform workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Super Admin</h1>
            <p className="text-muted-foreground">
              Manage tenants, subscriptions, platform users, and operational activity.
            </p>
          </div>
          <SignOutButton />
        </div>

        <SuperAdminDashboard metrics={metrics} />
      </div>
    </AppShell>
  );
}
