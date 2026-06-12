import { getPlanCatalog } from "@/features/billing/plan-catalog";
import { getStripePriceConfigurationStatus } from "@/features/billing/stripe-price-map";
import { requireSuperAdminContext } from "@/features/admin/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSuperAdminContext();
    const subscriptions = await prisma.subscription.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        businessId: true,
        planCode: true,
        status: true
      }
    });
    const latestByBusiness = new Map();

    for (const subscription of subscriptions) {
      if (!latestByBusiness.has(subscription.businessId)) {
        latestByBusiness.set(subscription.businessId, subscription);
      }
    }

    const latestSubscriptions = [...latestByBusiness.values()];
    const priceConfiguration = getStripePriceConfigurationStatus();
    const plans = getPlanCatalog().map((plan) => {
      const planSubscriptions = latestSubscriptions.filter(
        (subscription) => subscription.planCode === plan.code
      );
      const entitledTenants = planSubscriptions.filter((subscription) =>
        ["ACTIVE", "TRIALING"].includes(subscription.status)
      ).length;

      return {
        ...plan,
        stripeConfigured:
          plan.code === "TRIAL" ? true : Boolean(priceConfiguration[plan.code]),
        tenantCount: planSubscriptions.length,
        entitledTenantCount: entitledTenants,
        estimatedMrrCents:
          plan.code === "TRIAL"
            ? 0
            : planSubscriptions.filter(
                (subscription) => subscription.status === "ACTIVE"
              ).length * plan.monthlyPriceCents
      };
    });

    return ok({
      plans,
      pricingSource: "APPLICATION_CONFIGURATION",
      billingSource: "STRIPE_WEBHOOKS"
    });
  } catch (error) {
    return handleApiError(error);
  }
}
