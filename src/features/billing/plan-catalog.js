import { PLAN_LIMITS } from "@/features/businesses/plan-limits";

export const BILLING_PLAN_CODES = ["BASIC", "PRO"];

export const PLAN_CATALOG = {
  TRIAL: {
    code: "TRIAL",
    name: "Trial",
    monthlyPriceCents: 0,
    description: "Start building your booking workflow before choosing a paid plan.",
    cta: "Current trial",
    highlighted: false,
    features: [
      "Up to 3 services",
      "Up to 25 bookings per period",
      "1 team member",
      "Basic analytics"
    ]
  },
  BASIC: {
    code: "BASIC",
    name: "Basic",
    monthlyPriceCents: 1900,
    description: "For solo operators and small teams that need online booking.",
    cta: "Upgrade to Basic",
    highlighted: false,
    features: [
      "Up to 10 services",
      "Up to 250 bookings per period",
      "Up to 3 team members",
      "Basic analytics",
      "50 AI credits"
    ]
  },
  PRO: {
    code: "PRO",
    name: "Pro",
    monthlyPriceCents: 4900,
    description: "For growing service businesses with higher booking volume.",
    cta: "Upgrade to Pro",
    highlighted: true,
    features: [
      "Unlimited services",
      "Unlimited bookings",
      "Up to 10 team members",
      "Advanced analytics",
      "500 AI credits"
    ]
  }
};

export function getPlanLimits(planCode) {
  return PLAN_LIMITS[planCode] || PLAN_LIMITS.TRIAL;
}

export function getPlanCatalog() {
  return ["TRIAL", ...BILLING_PLAN_CODES].map((planCode) => ({
    ...PLAN_CATALOG[planCode],
    limits: getPlanLimits(planCode)
  }));
}
