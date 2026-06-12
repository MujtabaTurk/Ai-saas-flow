import { AppShell } from "@/components/layout/app-shell";
import { adminNavigation } from "@/config/navigation";
import { SubscriptionManagement } from "@/features/admin/components/subscription-management";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = {
  title: "Subscriptions | ServiceFlow Admin"
};

export default async function AdminSubscriptionsPage() {
  await requireSuperAdminPageSession();

  return (
    <AppShell navigation={adminNavigation} workspaceLabel="ServiceFlow Admin">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">
            Platform operations
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Subscriptions
          </h1>
          <p className="text-muted-foreground">
            Monitor plan state, payment health, billing periods, and Stripe
            linkage.
          </p>
        </div>
        <SubscriptionManagement />
      </div>
    </AppShell>
  );
}
