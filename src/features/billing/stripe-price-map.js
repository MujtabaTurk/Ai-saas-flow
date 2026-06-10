import { BILLING_PLAN_CODES } from "@/features/billing/plan-catalog";

const PRICE_ENV_KEYS = {
  BASIC: "STRIPE_BASIC_MONTHLY_PRICE_ID",
  PRO: "STRIPE_PRO_MONTHLY_PRICE_ID"
};

export function getStripePriceIdForPlan(planCode) {
  const envKey = PRICE_ENV_KEYS[planCode];

  return envKey ? process.env[envKey] || null : null;
}

export function resolvePlanCodeFromStripePriceId(priceId) {
  if (!priceId) {
    return null;
  }

  return (
    BILLING_PLAN_CODES.find(
      (planCode) => getStripePriceIdForPlan(planCode) === priceId
    ) || null
  );
}

export function getStripePriceConfigurationStatus() {
  return Object.fromEntries(
    BILLING_PLAN_CODES.map((planCode) => [
      planCode,
      Boolean(getStripePriceIdForPlan(planCode))
    ])
  );
}

export function getMissingStripePriceKeys() {
  return BILLING_PLAN_CODES
    .filter((planCode) => !getStripePriceIdForPlan(planCode))
    .map((planCode) => PRICE_ENV_KEYS[planCode]);
}

