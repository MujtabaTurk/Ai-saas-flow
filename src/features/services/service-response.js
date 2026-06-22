import { isSubscriptionEntitled } from "@/features/billing/status";
import {
  canActivateServiceForPlan,
  canCreateServiceForPlan,
  getServiceLimit
} from "@/features/services/policy";

export const serviceSelect = {
  id: true,
  businessId: true,
  name: true,
  slug: true,
  type: true,
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

export function buildServiceSummary({ business, services, user = null }) {
  const activeSubscription = business?.subscriptions?.[0] || null;
  const total = services.length;
  const active = services.filter((service) => service.isActive).length;
  const planCode = activeSubscription?.planCode || null;
  const serviceLimit = getServiceLimit(planCode);
  const subscriptionEntitled = isSubscriptionEntitled(activeSubscription);
  const canManage =
    user?.platformRole === "SUPER_ADMIN" ||
    ["OWNER", "ADMIN"].includes(user?.businessRole);

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
      canManage &&
      business?.status === "ACTIVE" &&
      subscriptionEntitled &&
      canCreateServiceForPlan(planCode, total),
    canActivate:
      canManage &&
      business?.status === "ACTIVE" &&
      subscriptionEntitled &&
      canActivateServiceForPlan(planCode, active),
    isReadOnly: business?.status !== "ACTIVE" || !canManage,
    subscriptionEntitled
  };
}
