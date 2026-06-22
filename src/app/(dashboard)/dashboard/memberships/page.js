import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BusinessMembershipDashboard } from "@/features/memberships/components/business-membership-dashboard";
import { resolveRequestLanguage } from "@/i18n/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Memberships | ServiceFlow"
};

export default async function MembershipsPage() {
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
      currency: true,
      timezone: true,
      locale: true
    }
  });

  if (!business) {
    redirect("/onboarding");
  }

  const language = await resolveRequestLanguage(business.locale);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">{business.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Memberships
          </h1>
          <p className="text-muted-foreground">
            Manage plans, active members, renewals, expiry, and membership revenue.
          </p>
        </div>

        <BusinessMembershipDashboard
          businessCurrency={business.currency}
          businessId={business.id}
          businessTimezone={business.timezone}
          isReadOnly={business.status !== "ACTIVE"}
          language={language}
        />
      </div>
    </AppShell>
  );
}
