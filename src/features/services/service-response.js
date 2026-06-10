import { isSubscriptionEntitled } from "@/features/billing/status";
import { canCreateServiceForPlan, getServiceLimit } from "@/features/services/policy";

export const serviceSelect = {
  id: true,
  businessId: true,
  name: true,
  slug: true,
  description: true,
  durationMin: true,
  bufferBeforeMin: true,
  bufferAfterMin: true,
  priceCents: true,
  currency: true,
  requiresPayment: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true
};

export const serviceListOrder = [{ sortOrder: "asc" }, { createdAt: "desc" }];

export function buildServiceSummary({ business, services }) {
  const activeSubscription = business?.subscriptions?.[0] || null;
  const total = services.length;
  const active = services.filter((service) => service.isActive).length;
  const planCode = activeSubscription?.planCode || null;
  const serviceLimit = getServiceLimit(planCode);
  const subscriptionEntitled = isSubscriptionEntitled(activeSubscription);

  return {
    total,
    active,
    inactive: total - active,
    businessStatus: business?.status || null,
    planCode,
    subscriptionStatus: activeSubscription?.status || null,
    serviceLimit,
    remainingServices: serviceLimit === null ? null : Math.max(serviceLimit - total, 0),
    canCreate:
      business?.status === "ACTIVE" &&
      subscriptionEntitled &&
      canCreateServiceForPlan(planCode, total),
    isReadOnly: business?.status !== "ACTIVE",
    subscriptionEntitled
  };
}
