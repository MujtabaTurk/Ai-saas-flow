import { AppShell } from "@/components/layout/app-shell";
import { BillingManagement } from "@/features/billing/components/billing-management";
import { requireDashboardPageSession } from "@/lib/auth/dashboard-page";

export const metadata = {
  title: "Billing | ServiceFlow"
};

export default async function BillingPage({ searchParams }) {
  const session = await requireDashboardPageSession();
  const resolvedSearchParams = await searchParams;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">
            {session.user.activeBusinessName || "Business workspace"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Billing
          </h1>
          <p className="text-muted-foreground">
            Manage your ServiceFlow subscription, payment methods, invoices, and feature limits.
          </p>
        </div>

        <BillingManagement
          checkoutStatus={
            typeof resolvedSearchParams.checkout === "string"
              ? resolvedSearchParams.checkout
              : null
          }
          checkoutSessionId={
            typeof resolvedSearchParams.session_id === "string"
              ? resolvedSearchParams.session_id
              : null
          }
        />
      </div>
    </AppShell>
  );
}
