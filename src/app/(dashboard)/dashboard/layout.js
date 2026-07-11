import { AppShell } from "@/components/layout/app-shell";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";

function formatPlanLabel(entitlement) {
  if (!entitlement.planCode) {
    return "No active plan";
  }

  const planName = entitlement.planCode
    .toLowerCase()
    .replace(/^\w/, (character) => character.toUpperCase());

  return entitlement.status
    ? `${planName} ${entitlement.status.toLowerCase()}`
    : planName;
}

export default async function DashboardLayout({ children }) {
  const { business } = await requireDashboardPageBusiness({
    select: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          planCode: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          trialEndsAt: true
        }
      }
    }
  });
  const entitlement = getSubscriptionEntitlement(
    business.subscriptions[0] || null
  );

  return (
    <AppShell planLabel={formatPlanLabel(entitlement)}>{children}</AppShell>
  );
}
