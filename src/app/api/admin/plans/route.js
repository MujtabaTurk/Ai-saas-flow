import { getPlanCatalog } from "@/features/billing/plan-catalog";
import { getStripePriceConfigurationStatus } from "@/features/billing/stripe-price-map";
import { requireSuperAdminContext } from "@/features/admin/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api/errors";
import { normalizePlanInput } from "@/features/admin/plan-input";

export const runtime = "nodejs";

const defaultLimits = (plan) => plan.limits || {};

async function seedLegacyPlans() {
  const existing = await prisma.platformPlan.count();
  if (existing) return;
  const plans = getPlanCatalog();
  await Promise.all(plans.map((plan, index) => prisma.platformPlan.create({
    data: {
      code: plan.code,
      name: plan.name,
      monthlyPriceCents: plan.monthlyPriceCents,
      description: plan.description,
      features: plan.features,
      limits: defaultLimits(plan),
      sortOrder: index,
      status: "ACTIVE"
    }
  })));
}

function serialize(plan, counts = {}) {
  return {
    ...plan,
    features: Array.isArray(plan.features) ? plan.features : [],
    limits: plan.limits || {},
    aiFeatures: plan.aiFeatures || {},
    tenantCount: counts.tenantCount || 0,
    entitledTenantCount: counts.entitledTenantCount || 0,
    stripeConfigured: Boolean(plan.stripePriceId) || Boolean(getStripePriceConfigurationStatus()[plan.code])
  };
}

export async function GET() {
  try {
    await requireSuperAdminContext();
    await seedLegacyPlans();
    const [plans, subscriptions] = await Promise.all([
      prisma.platformPlan.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.subscription.findMany({ select: { platformPlanId: true, planCode: true, status: true } })
    ]);
    return ok({ plans: plans.map((plan) => {
      const matching = subscriptions.filter((subscription) =>
        subscription.platformPlanId === plan.id || subscription.planCode === plan.code
      );
      return serialize(plan, { tenantCount: matching.length, entitledTenantCount: matching.filter((item) => ["ACTIVE", "TRIALING"].includes(item.status)).length });
    }) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request) {
  try {
    await requireSuperAdminContext();
    const data = normalizePlanInput(await request.json());
    let plan;
    try { plan = await prisma.platformPlan.create({ data }); }
    catch (error) { if (error?.code === "P2002") throw new AppError("A plan with this code already exists.", 409); throw error; }
    return ok({ plan: serialize(plan) }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
