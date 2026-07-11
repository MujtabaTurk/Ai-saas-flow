import { isSuperAdmin } from "@/features/auth/permissions";
import { CustomerManagement } from "@/features/customers/components/customer-management";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";

export const metadata = {
  title: "Customers | ServiceFlow"
};

export default async function CustomersPage() {
  const { business, session } = await requireDashboardPageBusiness({
    select: {
      id: true,
      name: true,
      status: true,
      timezone: true,
      locale: true
    }
  });

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">{business.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer profiles, private notes, consent, and booking
            relationships.
          </p>
        </div>

        <CustomerManagement
          businessId={business.id}
          businessLocale={business.locale}
          businessTimezone={business.timezone}
          isReadOnly={
            business.status !== "ACTIVE" && !isSuperAdmin(session.user)
          }
        />
      </div>
    </>
  );
}
