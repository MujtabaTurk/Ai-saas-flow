import { AppShell } from "@/components/layout/app-shell";
import { TeamManagement } from "@/features/team/components/team-management";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";

export const metadata = {
  title: "Team | ServiceFlow"
};

export default async function TeamPage() {
  const { business } = await requireDashboardPageBusiness({
    select: {
      id: true,
      name: true
    }
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">{business.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Invite staff, manage tenant roles, and coordinate service and
            booking assignments.
          </p>
        </div>
        <TeamManagement businessId={business.id} />
      </div>
    </AppShell>
  );
}
