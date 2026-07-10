import { AppShell } from "@/components/layout/app-shell";
import { NotificationManagement } from "@/features/notifications/components/notification-management";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";

export const metadata = {
  title: "Notifications | ServiceFlow"
};

export default async function NotificationsPage() {
  const { business } = await requireDashboardPageBusiness({
    select: {
      id: true,
      name: true,
      timezone: true
    }
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">{business.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Monitor booking alerts, subscription events, and email delivery.
          </p>
        </div>

        <NotificationManagement
          businessId={business.id}
          businessTimezone={business.timezone}
        />
      </div>
    </AppShell>
  );
}
