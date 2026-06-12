import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TeamManagement } from "@/features/team/components/team-management";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Team | ServiceFlow"
};

export default async function TeamPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId) {
    redirect("/onboarding");
  }

  const business = await prisma.business.findUnique({
    where: {
      id: session.user.activeBusinessId
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!business) {
    redirect("/onboarding");
  }

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
