import { PrismaClient } from "@prisma/client";

const legacyPlans = [
  { code: "TRIAL", name: "Trial", monthlyPriceCents: 0, description: "Start building your booking workflow before choosing a paid plan.", features: ["Up to 3 services", "Up to 25 bookings per period", "1 team member", "Basic analytics"], limits: { services: 3, bookings: 25, teamMembers: 1, aiCredits: 0 } },
  { code: "BASIC", name: "Basic", monthlyPriceCents: 1900, description: "For solo operators and small teams that need online booking.", features: ["Up to 10 services", "Up to 250 bookings per period", "Up to 3 team members", "Basic analytics", "50 AI credits"], limits: { services: 10, bookings: 250, teamMembers: 3, aiCredits: 50 } },
  { code: "PRO", name: "Pro", monthlyPriceCents: 4900, description: "For growing service businesses with higher booking volume.", features: ["Unlimited services", "Unlimited bookings", "Up to 10 team members", "Advanced analytics", "500 AI credits"], limits: { services: null, bookings: null, teamMembers: 10, aiCredits: 500 } }
];

const prisma = new PrismaClient();

try {
  for (const [sortOrder, plan] of legacyPlans.entries()) {
    await prisma.platformPlan.upsert({
      where: { code: plan.code },
      update: {},
      create: {
        code: plan.code,
        name: plan.name,
        monthlyPriceCents: plan.monthlyPriceCents,
        description: plan.description,
        features: plan.features,
        limits: plan.limits,
        sortOrder,
        status: "ACTIVE"
      }
    });
  }

  const plans = await prisma.platformPlan.findMany({ select: { id: true, code: true } });
  const subscriptions = await prisma.subscription.findMany({
    where: { platformPlanId: null },
    select: { id: true, planCode: true }
  });

  let migrated = 0;
  for (const subscription of subscriptions) {
    const plan = plans.find((candidate) => candidate.code === (subscription.planCode || "TRIAL"));
    if (!plan) {
      console.warn(`Skipping subscription ${subscription.id}: unknown plan ${subscription.planCode}`);
      continue;
    }
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { platformPlanId: plan.id }
    });
    migrated += 1;
  }

  console.log(JSON.stringify({ mappedSubscriptions: migrated, platformPlans: plans.length }, null, 2));
} finally {
  await prisma.$disconnect();
}
