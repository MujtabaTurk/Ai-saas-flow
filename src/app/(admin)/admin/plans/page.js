import { PlanManagement } from "@/features/admin/components/plan-management";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = {
  title: "Plans | ServiceFlow Admin"
};

export default async function AdminPlansPage() {
  await requireSuperAdminPageSession();

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">
            Platform operations
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Plans
          </h1>
          <p className="text-muted-foreground">
            Review pricing, entitlement limits, Stripe readiness, and tenant
            distribution.
          </p>
        </div>
        <PlanManagement />
      </div>
    </>
  );
}
