import {
  assertBusinessManagement,
  isSuperAdmin
} from "@/features/auth/permissions";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import { PLAN_LIMITS } from "@/features/businesses/plan-limits";
import {
  ANALYTICS_LEVELS,
  ANALYTICS_PERIOD_OPTIONS,
  BASIC_ANALYTICS_PERIOD_DAYS
} from "@/features/analytics/constants";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function requireAnalyticsContext(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before viewing analytics.",
      409
    );
  }

  if (!isValidMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBusinessManagement(user, businessId);
  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      name: true,
      status: true,
      timezone: true,
      currency: true,
      subscriptions: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        select: {
          planCode: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          trialEndsAt: true
        }
      }
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  return {
    user,
    business
  };
}

export function buildAnalyticsAccess({ user, business }) {
  const subscription = business.subscriptions[0] || null;
  const entitlement = getSubscriptionEntitlement(subscription);
  const platformOverride = isSuperAdmin(user);
  const configuredLevel =
    PLAN_LIMITS[subscription?.planCode]?.analytics || null;
  const level = platformOverride
    ? ANALYTICS_LEVELS.ADVANCED
    : configuredLevel;
  const canView = platformOverride || entitlement.isEntitled;
  const isAdvanced =
    canView && level === ANALYTICS_LEVELS.ADVANCED;

  return {
    canView,
    isAdvanced,
    level,
    planCode: entitlement.planCode,
    subscriptionStatus: entitlement.status,
    subscriptionEntitled: entitlement.isEntitled,
    entitlementReason: entitlement.reason,
    businessStatus: business.status,
    allowedPeriods: isAdvanced
      ? ANALYTICS_PERIOD_OPTIONS
      : [BASIC_ANALYTICS_PERIOD_DAYS]
  };
}

export function parseAnalyticsPeriod(searchParams, access) {
  const rawPeriod = searchParams.get("days");
  const days = rawPeriod
    ? Number(rawPeriod)
    : BASIC_ANALYTICS_PERIOD_DAYS;

  if (
    !Number.isInteger(days) ||
    !ANALYTICS_PERIOD_OPTIONS.includes(days)
  ) {
    throw new AppError("Choose a valid analytics period.", 422, {
      days: `Choose one of ${ANALYTICS_PERIOD_OPTIONS.join(", ")} days.`
    });
  }

  if (!access.allowedPeriods.includes(days)) {
    throw new AppError(
      "Flexible analytics periods require the Pro plan.",
      403,
      {
        days: "The current plan supports the 30-day analytics view."
      }
    );
  }

  return days;
}

export function assertAnalyticsAccess(access) {
  if (access.canView) {
    return;
  }

  throw new AppError(
    "An active subscription is required before viewing business analytics.",
    402
  );
}
