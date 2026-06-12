import { isSuperAdmin } from "@/features/auth/permissions";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import { getBookingLimit } from "@/features/bookings/policy";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export function getBookingPlanPeriod(subscription) {
  return {
    start: subscription?.currentPeriodStart || new Date(0),
    end:
      subscription?.currentPeriodEnd ||
      subscription?.trialEndsAt ||
      new Date("9999-12-31")
  };
}

export function buildBookingConfigurationAccess(
  business,
  user = null,
  now = new Date()
) {
  const subscription = business?.subscriptions?.[0] || null;
  const entitlement = getSubscriptionEntitlement(subscription, now);
  const hasPlatformOverride = isSuperAdmin(user);
  const configurationReadOnly =
    business?.status !== "ACTIVE" && !hasPlatformOverride;
  const hasManagementRole =
    !user ||
    hasPlatformOverride ||
    ["OWNER", "ADMIN"].includes(user?.businessRole);

  return {
    businessStatus: business?.status || null,
    planCode: entitlement.planCode,
    subscriptionStatus: entitlement.status,
    subscriptionEntitled: entitlement.isEntitled,
    entitlementReason: entitlement.reason,
    configurationReadOnly,
    canConfigure:
      !configurationReadOnly &&
      (entitlement.isEntitled || hasPlatformOverride) &&
      hasManagementRole
  };
}

export function buildBookingCreationAccess({
  business,
  bookingCount,
  user = null,
  now = new Date()
}) {
  const configurationAccess = buildBookingConfigurationAccess(
    business,
    user,
    now
  );
  const limit = getBookingLimit(configurationAccess.planCode);
  const hasCapacity = limit === null || bookingCount < limit;
  const businessActive = business?.status === "ACTIVE";
  const canCreate =
    businessActive &&
    configurationAccess.subscriptionEntitled &&
    hasCapacity;

  let reason = null;

  if (!businessActive) {
    reason = "BUSINESS_INACTIVE";
  } else if (!configurationAccess.subscriptionEntitled) {
    reason = configurationAccess.entitlementReason;
  } else if (!hasCapacity) {
    reason = "PLAN_LIMIT_REACHED";
  }

  return {
    ...configurationAccess,
    bookingLimit: limit,
    bookingCount,
    remainingBookings:
      limit === null ? null : Math.max(limit - bookingCount, 0),
    canCreate,
    createBlockedReason: reason,
    canManageExisting: true
  };
}

export async function getBookingCreationAccess({
  business,
  user = null,
  now = new Date()
}) {
  const subscription = business?.subscriptions?.[0] || null;
  const period = getBookingPlanPeriod(subscription);
  const bookingCount = await prisma.booking.count({
    where: {
      businessId: business.id,
      createdAt: {
        gte: period.start,
        lt: period.end
      }
    }
  });

  return buildBookingCreationAccess({
    business,
    bookingCount,
    user,
    now
  });
}

export function assertBookingCreationAllowed(access) {
  if (access.canCreate) {
    return;
  }

  if (access.createBlockedReason === "BUSINESS_INACTIVE") {
    throw new AppError("This business is not accepting new bookings.", 403);
  }

  if (
    access.createBlockedReason === "MISSING_SUBSCRIPTION" ||
    access.createBlockedReason === "STATUS_NOT_ENTITLED" ||
    access.createBlockedReason === "PERIOD_EXPIRED"
  ) {
    throw new AppError(
      "An active subscription is required before accepting bookings.",
      402
    );
  }

  if (access.createBlockedReason === "PLAN_LIMIT_REACHED") {
    throw new AppError(
      "This business has reached its booking limit for the current plan period.",
      403,
      {
        limit: access.bookingLimit
      }
    );
  }

  throw new AppError("New bookings are not available.", 403);
}
