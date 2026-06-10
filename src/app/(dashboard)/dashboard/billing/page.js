import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BillingManagement } from "@/features/billing/components/billing-management";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata = {
  title: "Billing | ServiceFlow"
};

export default async function BillingPage({ searchParams }) {
  const session = await getCurrentSession();
  const resolvedSearchParams = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId) {
    redirect("/onboarding");
  }

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
        />
      </div>
    </AppShell>
  );
}

