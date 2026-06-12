import { AppShell } from "@/components/layout/app-shell";
import { adminNavigation } from "@/config/navigation";
import { UserManagement } from "@/features/admin/components/user-management";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = {
  title: "Users | ServiceFlow Admin"
};

export default async function AdminUsersPage() {
  await requireSuperAdminPageSession();

  return (
    <AppShell navigation={adminNavigation} workspaceLabel="ServiceFlow Admin">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">
            Platform operations
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Users
          </h1>
          <p className="text-muted-foreground">
            Inspect platform identities and manage privileged platform roles.
          </p>
        </div>
        <UserManagement />
      </div>
    </AppShell>
  );
}
