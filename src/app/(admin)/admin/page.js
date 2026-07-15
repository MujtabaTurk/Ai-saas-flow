import { redirect } from "next/navigation";
import { SuperAdminDashboard } from "@/features/admin/components/super-admin-dashboard";
import { getSuperAdminMetrics } from "@/features/admin/metrics";
import { isSuperAdmin } from "@/features/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata = {
  title: "Admin | ServiceFlow"
};

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!isSuperAdmin(session.user)) {
    redirect("/dashboard");
  }

  const metrics = await getSuperAdminMetrics();

  return (
    <>
      <div className="space-y-6">
        <div>
          <div>
            <p className="text-sm font-semibold text-primary">Platform workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Super Admin</h1>
            <p className="text-muted-foreground">
              Manage businesses, subscriptions, plans, and operational activity.
            </p>
          </div>
        </div>

        <SuperAdminDashboard metrics={metrics} />
      </div>
    </>
  );
}
