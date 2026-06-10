import { PLAN_LIMITS } from "@/features/businesses/plan-limits";

export function canCreateServiceForPlan(planCode, currentServiceCount) {
  const serviceLimit = PLAN_LIMITS[planCode]?.services;

  if (serviceLimit === null || serviceLimit === undefined) {
    return true;
  }

  return currentServiceCount < serviceLimit;
}

export function canActivateServiceForPlan(planCode, currentActiveServiceCount) {
  const serviceLimit = PLAN_LIMITS[planCode]?.services;

  if (serviceLimit === null || serviceLimit === undefined) {
    return true;
  }

  return currentActiveServiceCount < serviceLimit;
}

export function getServiceLimit(planCode) {
  return PLAN_LIMITS[planCode]?.services ?? null;
}
