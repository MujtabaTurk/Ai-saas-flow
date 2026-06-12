import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isSuperAdmin } from "@/features/auth/permissions";
import { AvailabilityManagement } from "@/features/availability/components/availability-management";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Availability | ServiceFlow"
};

export default async function AvailabilityPage() {
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
      name: true,
      status: true,
      timezone: true
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
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Availability</h1>
          <p className="text-muted-foreground">
            Manage weekly working hours, break gaps, slot intervals, buffers, and unavailable dates.
          </p>
        </div>

        <AvailabilityManagement
          businessId={business.id}
          timezone={business.timezone}
          isReadOnly={
            business.status !== "ACTIVE" && !isSuperAdmin(session.user)
          }
        />
      </div>
    </AppShell>
  );
}
