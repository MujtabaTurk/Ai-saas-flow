import { AppShell } from "@/components/layout/app-shell";
import { adminNavigation } from "@/config/navigation";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export default async function AdminLayout({ children }) {
  await requireSuperAdminPageSession();

  return (
    <AppShell navigation={adminNavigation} workspaceLabel="ServiceFlow Admin">
      {children}
    </AppShell>
  );
}
