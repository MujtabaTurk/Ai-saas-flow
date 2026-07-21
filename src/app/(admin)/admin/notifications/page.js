import { AdminNotificationCenter } from "@/features/admin/components/admin-notification-center";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = { title: "Admin Notifications | ServiceFlow" };

export default async function AdminNotificationsPage() {
  await requireSuperAdminPageSession();
  return <div className="space-y-6"><div><p className="text-sm font-semibold text-primary">Platform workspace</p><h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Notifications</h1></div><AdminNotificationCenter /></div>;
}
