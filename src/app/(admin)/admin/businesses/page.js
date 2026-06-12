import { AppShell } from "@/components/layout/app-shell";
import { adminNavigation } from "@/config/navigation";
import { BusinessManagement } from "@/features/admin/components/business-management";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = {
  title: "Businesses | ServiceFlow Admin"
};

export default async function AdminBusinessesPage() {
  await requireSuperAdminPageSession();

  return (
    <AppShell navigation={adminNavigation} workspaceLabel="ServiceFlow Admin">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">
            Platform operations
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Businesses
          </h1>
          <p className="text-muted-foreground">
            Review tenant health and control active, suspended, and archived
            lifecycle states.
          </p>
        </div>
        <BusinessManagement />
      </div>
    </AppShell>
  );
}
