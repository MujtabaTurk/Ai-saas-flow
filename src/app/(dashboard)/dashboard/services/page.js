import { ServiceManagement } from "@/features/services/components/service-management";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";

export const metadata = {
  title: "Services | ServiceFlow"
};

export default async function ServicesPage() {
  const { business } = await requireDashboardPageBusiness({
    select: {
      id: true,
      name: true,
      status: true,
      currency: true
    }
  });

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">{business.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Service Management</h1>
          <p className="text-muted-foreground">
            Create, edit, delete, activate, and deactivate the services customers can book.
          </p>
        </div>

        <ServiceManagement
          businessCurrency={business.currency}
          businessId={business.id}
          isReadOnly={business.status !== "ACTIVE"}
        />
      </div>
    </>
  );
}
