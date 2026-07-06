import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ANALYTICS_PERIOD_OPTIONS } from "@/features/analytics/constants";
import { OverviewDashboard } from "@/features/analytics/components/overview-dashboard";
import { isSuperAdmin } from "@/features/auth/permissions";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import { PLAN_LIMITS } from "@/features/businesses/plan-limits";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Overview | ServiceFlow"
};

function formatPlanLabel(entitlement) {
  if (!entitlement.planCode) {
    return "No active plan";
  }

  const planName = entitlement.planCode
    .toLowerCase()
    .replace(/^\w/, (character) => character.toUpperCase());

  return entitlement.status ? `${planName} ${entitlement.status.toLowerCase()}` : planName;
}

function getInitialDays(rawDays, sessionUser, entitlement) {
  const requestedDays = Number(rawDays);

  if (
    !Number.isInteger(requestedDays) ||
    !ANALYTICS_PERIOD_OPTIONS.includes(requestedDays)
  ) {
    return 30;
  }

  const analyticsLevel =
    PLAN_LIMITS[entitlement.planCode]?.analytics || "basic";
  const allowedPeriods =
    isSuperAdmin(sessionUser) || analyticsLevel === "advanced"
      ? ANALYTICS_PERIOD_OPTIONS
      : [30];

  return allowedPeriods.includes(requestedDays) ? requestedDays : 30;
}

export default async function OverviewPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
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
      currency: true,
      subscriptions: {
        orderBy: {
          createdAt: "desc"
        },
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

  if (!business) {
    redirect("/onboarding");
  }

  const entitlement = getSubscriptionEntitlement(
    business.subscriptions[0] || null
  );

  return (
    <AppShell planLabel={formatPlanLabel(entitlement)}>
      <OverviewDashboard
        businessCurrency={business.currency}
        businessId={business.id}
        businessName={business.name}
        businessRole={session.user.businessRole}
        businessTimezone={business.timezone}
        currentPlan={formatPlanLabel(entitlement)}
        initialDays={getInitialDays(
          resolvedSearchParams?.days,
          session.user,
          entitlement
        )}
      />
    </AppShell>
  );
}
