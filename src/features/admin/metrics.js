import { PLAN_CATALOG } from "@/features/billing/plan-catalog";
import { prisma } from "@/lib/prisma";

const ADMIN_PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_REVENUE_STATUSES = ["ACTIVE"];
const PAYMENT_RISK_STATUSES = ["PAST_DUE", "UNPAID", "INCOMPLETE"];

function getPeriodStart(now) {
  return new Date(now.getTime() - ADMIN_PERIOD_DAYS * DAY_MS);
}

function isPaidPlan(planCode) {
  return planCode === "BASIC" || planCode === "PRO";
}

function getMonthlyPriceCents(planCode) {
  return PLAN_CATALOG[planCode]?.monthlyPriceCents || 0;
}

function getLatestSubscriptionsByBusiness(subscriptions) {
  const latestSubscriptions = new Map();

  for (const subscription of subscriptions) {
    if (!latestSubscriptions.has(subscription.businessId)) {
      latestSubscriptions.set(subscription.businessId, subscription);
    }
  }

  return [...latestSubscriptions.values()];
}

function incrementCount(counts, key) {
  counts[key] = (counts[key] || 0) + 1;
}

function getPlanDistribution(subscriptions) {
  const counts = {
    TRIAL: 0,
    BASIC: 0,
    PRO: 0
  };

  for (const subscription of subscriptions) {
    incrementCount(counts, subscription.planCode);
  }

  return counts;
}

function getStatusDistribution(subscriptions) {
  const counts = {};

  for (const subscription of subscriptions) {
    incrementCount(counts, subscription.status);
  }

  return counts;
}

function getRevenueMetrics(subscriptions, periodStart) {
  const activePaidSubscriptions = subscriptions.filter(
    (subscription) =>
      isPaidPlan(subscription.planCode) &&
      ACTIVE_REVENUE_STATUSES.includes(subscription.status)
  );
  const mrrCents = activePaidSubscriptions.reduce(
    (total, subscription) => total + getMonthlyPriceCents(subscription.planCode),
    0
  );
  const newMrrCents = activePaidSubscriptions
    .filter((subscription) => subscription.createdAt >= periodStart)
    .reduce(
      (total, subscription) => total + getMonthlyPriceCents(subscription.planCode),
      0
    );
  const churnedMrrCents = subscriptions
    .filter(
      (subscription) =>
        isPaidPlan(subscription.planCode) &&
        subscription.status === "CANCELED" &&
        (subscription.canceledAt || subscription.updatedAt) >= periodStart
    )
    .reduce(
      (total, subscription) => total + getMonthlyPriceCents(subscription.planCode),
      0
    );
  const failedPaymentCount = subscriptions.filter(
    (subscription) =>
      PAYMENT_RISK_STATUSES.includes(subscription.status) ||
      (subscription.lastPaymentFailedAt &&
        subscription.lastPaymentFailedAt >= periodStart)
  ).length;

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    newMrrCents,
    churnedMrrCents,
    failedPaymentCount,
    activePaidCount: activePaidSubscriptions.length
  };
}

function getSubscriptionMetrics(subscriptions) {
  const statusDistribution = getStatusDistribution(subscriptions);
  const planDistribution = getPlanDistribution(subscriptions);
  const activePaidCount = subscriptions.filter(
    (subscription) =>
      isPaidPlan(subscription.planCode) &&
      ACTIVE_REVENUE_STATUSES.includes(subscription.status)
  ).length;
  const trialingCount = statusDistribution.TRIALING || 0;
  const conversionPool = activePaidCount + trialingCount;

  return {
    activePaidCount,
    trialingCount,
    pastDueCount: statusDistribution.PAST_DUE || 0,
    canceledCount: statusDistribution.CANCELED || 0,
    trialConversionRate:
      conversionPool === 0 ? 0 : Math.round((activePaidCount / conversionPool) * 100),
    planDistribution,
    statusDistribution
  };
}

function countUnique(values) {
  return new Set(values.filter(Boolean)).size;
}

export async function getSuperAdminMetrics() {
  const now = new Date();
  const periodStart = getPeriodStart(now);

  const [
    users,
    activeSessions,
    customers,
    businesses,
    bookingBusinessIds,
    totalBookings,
    totalServices,
    allSubscriptions,
    failedWebhookEvents,
    recentBusinesses
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        platformRole: true,
        createdAt: true
      }
    }),
    prisma.session.findMany({
      where: {
        expires: {
          gt: now
        }
      },
      select: {
        userId: true
      }
    }),
    prisma.customer.findMany({
      select: {
        id: true,
        userId: true
      }
    }),
    prisma.business.findMany({
      select: {
        id: true,
        ownerId: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.booking.findMany({
      select: {
        businessId: true
      }
    }),
    prisma.booking.count(),
    prisma.service.count(),
    prisma.subscription.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        businessId: true,
        planCode: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
        cancelAtPeriodEnd: true,
        canceledAt: true,
        lastPaymentFailedAt: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.stripeWebhookEvent.count({
      where: {
        status: "FAILED"
      }
    }),
    prisma.business.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            services: true,
            bookings: true,
            customers: true
          }
        },
        subscriptions: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          select: {
            planCode: true,
            status: true
          }
        }
      }
    })
  ]);

  const latestSubscriptions = getLatestSubscriptionsByBusiness(allSubscriptions);
  const businessStatusCounts = businesses.reduce(
    (counts, business) => {
      incrementCount(counts, business.status);
      return counts;
    },
    {
      ACTIVE: 0,
      SUSPENDED: 0,
      ARCHIVED: 0
    }
  );
  const businessesWithBookings = countUnique(
    bookingBusinessIds.map((booking) => booking.businessId)
  );
  const businessOwnerCount = countUnique(businesses.map((business) => business.ownerId));

  return {
    generatedAt: now,
    periodLabel: `Last ${ADMIN_PERIOD_DAYS} days`,
    revenue: getRevenueMetrics(latestSubscriptions, periodStart),
    subscriptions: getSubscriptionMetrics(latestSubscriptions),
    users: {
      totalUsers: users.length,
      newUsers: users.filter((user) => user.createdAt >= periodStart).length,
      activeUsers: countUnique(activeSessions.map((session) => session.userId)),
      superAdmins: users.filter((user) => user.platformRole === "SUPER_ADMIN").length,
      platformAdmins: users.filter((user) => user.platformRole === "ADMIN").length,
      businessOwners: businessOwnerCount,
      customerProfiles: customers.length,
      linkedCustomerUsers: countUnique(customers.map((customer) => customer.userId)),
      staffUsers: 0
    },
    businesses: {
      totalBusinesses: businesses.length,
      newBusinesses: businesses.filter((business) => business.createdAt >= periodStart)
        .length,
      activeBusinesses: businessStatusCounts.ACTIVE || 0,
      suspendedBusinesses: businessStatusCounts.SUSPENDED || 0,
      archivedBusinesses: businessStatusCounts.ARCHIVED || 0,
      businessesWithBookings,
      averageBookingsPerBusiness:
        businesses.length === 0 ? 0 : Math.round((totalBookings / businesses.length) * 10) / 10,
      totalBookings,
      totalServices,
      recentBusinesses
    },
    risk: {
      suspendedBusinesses: businessStatusCounts.SUSPENDED || 0,
      failedPayments: getRevenueMetrics(latestSubscriptions, periodStart).failedPaymentCount,
      failedWebhookEvents,
      pastDueSubscriptions: getSubscriptionMetrics(latestSubscriptions).pastDueCount
    }
  };
}

