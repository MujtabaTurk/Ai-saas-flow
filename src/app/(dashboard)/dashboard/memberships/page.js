import { BusinessMembershipDashboard } from "@/features/memberships/components/business-membership-dashboard";
import { resolveRequestLanguage } from "@/i18n/server";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";

export const metadata = {
  title: "Memberships | ServiceFlow"
};

export default async function MembershipsPage() {
  const { business } = await requireDashboardPageBusiness({
    select: {
      id: true,
      name: true,
      status: true,
      currency: true,
      timezone: true,
      locale: true
    }
  });

  const language = await resolveRequestLanguage(business.locale);

  return (
    <>
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
    </>
  );
}
