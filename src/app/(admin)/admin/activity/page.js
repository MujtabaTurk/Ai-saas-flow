import { AppShell } from "@/components/layout/app-shell";
import { adminNavigation } from "@/config/navigation";
import { ActivityManagement } from "@/features/admin/components/activity-management";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = {
  title: "Activity | ServiceFlow Admin"
};

export default async function AdminActivityPage() {
  await requireSuperAdminPageSession();

  return (
    <AppShell navigation={adminNavigation} workspaceLabel="ServiceFlow Admin">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">
            Platform operations
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Activity
          </h1>
          <p className="text-muted-foreground">
            Review the audit trail for sensitive administrative changes.
          </p>
        </div>
        <ActivityManagement />
      </div>
    </AppShell>
  );
}
