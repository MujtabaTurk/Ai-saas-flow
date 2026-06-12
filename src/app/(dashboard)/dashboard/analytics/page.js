import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";
import { isSuperAdmin } from "@/features/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Analytics | ServiceFlow"
};

export default async function AnalyticsPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId) {
    redirect("/onboarding");
  }

  if (
    !isSuperAdmin(session.user) &&
    !["OWNER", "ADMIN"].includes(session.user.businessRole)
  ) {
    redirect("/dashboard/bookings");
  }

  const business = await prisma.business.findUnique({
    where: {
      id: session.user.activeBusinessId
    },
    select: {
      id: true,
      name: true,
      timezone: true,
      currency: true
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
            Business Analytics
          </h1>
          <p className="text-muted-foreground">
            Understand booking outcomes, customer activity, service demand, and
            estimated booked value.
          </p>
        </div>
        <AnalyticsDashboard
          businessCurrency={business.currency}
          businessId={business.id}
          businessTimezone={business.timezone}
        />
      </div>
    </AppShell>
  );
}
