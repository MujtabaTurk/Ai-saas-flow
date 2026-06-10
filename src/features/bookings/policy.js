import { PLAN_LIMITS } from "@/features/businesses/plan-limits";

export function getBookingLimit(planCode) {
  return PLAN_LIMITS[planCode]?.bookings ?? null;
}

export function canCreateBookingForPlan(planCode, bookingCount) {
  const limit = getBookingLimit(planCode);

  return limit === null || bookingCount < limit;
}

