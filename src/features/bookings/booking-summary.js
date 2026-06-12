import { formatDateTimeInTimezone, zonedDateTimeToUtc, addDaysToDateValue } from "@/features/availability/time";
import {
  buildBookingCreationAccess,
  getBookingPlanPeriod
} from "@/features/bookings/access";
import { BOOKING_STATUSES } from "@/features/bookings/constants";
import { prisma } from "@/lib/prisma";

const ACTIVE_BOOKING_STATUSES = [BOOKING_STATUSES.PENDING, BOOKING_STATUSES.CONFIRMED];

export async function buildBookingSummary({
  business,
  filteredWhere,
  scopeWhere = {},
  user = null,
  now = new Date()
}) {
  const subscription = business.subscriptions?.[0] || null;
  const { start: planPeriodStart, end: planPeriodEnd } =
    getBookingPlanPeriod(subscription);
  const localToday = formatDateTimeInTimezone(now, business.timezone).date;
  const todayStart = zonedDateTimeToUtc(localToday, "00:00", business.timezone);
  const tomorrowStart = zonedDateTimeToUtc(addDaysToDateValue(localToday, 1), "00:00", business.timezone);
  const baseWhere = {
    businessId: business.id,
    ...scopeWhere
  };
  const statusValues = Object.values(BOOKING_STATUSES);
  const [
    filteredTotal,
    today,
    upcoming,
    planUsed,
    ...statusCounts
  ] = await Promise.all([
    prisma.booking.count({ where: filteredWhere }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        startsAt: {
          gte: todayStart,
          lt: tomorrowStart
        }
      }
    }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: {
          in: ACTIVE_BOOKING_STATUSES
        },
        startsAt: {
          gte: now
        }
      }
    }),
    prisma.booking.count({
      where: {
        businessId: business.id,
        createdAt: {
          gte: planPeriodStart,
          lt: planPeriodEnd
        }
      }
    }),
    ...statusValues.map((status) =>
      prisma.booking.count({
        where: {
          ...baseWhere,
          status
        }
      })
    )
  ]);

  const countsByStatus = statusValues.reduce((acc, status, index) => {
    acc[status] = statusCounts[index];
    return acc;
  }, {});
  const access = buildBookingCreationAccess({
    business,
    bookingCount: planUsed,
    user,
    now
  });
  const canManageConfiguration =
    user?.platformRole === "SUPER_ADMIN" ||
    ["OWNER", "ADMIN"].includes(user?.businessRole);

  return {
    filteredTotal,
    today,
    upcoming,
    statusCounts: countsByStatus,
    active:
      countsByStatus[BOOKING_STATUSES.PENDING] +
      countsByStatus[BOOKING_STATUSES.CONFIRMED],
    terminal:
      countsByStatus[BOOKING_STATUSES.CANCELED] +
      countsByStatus[BOOKING_STATUSES.COMPLETED] +
      countsByStatus[BOOKING_STATUSES.NO_SHOW],
    plan: {
      code: access.planCode,
      status: access.subscriptionStatus,
      subscriptionEntitled: access.subscriptionEntitled,
      limit: access.bookingLimit,
      used: planUsed,
      remaining: access.remainingBookings,
      periodStart: planPeriodStart,
      periodEnd: planPeriodEnd
    },
    access: {
      ...access,
      canCreate: access.canCreate && canManageConfiguration,
      canConfigure: access.canConfigure && canManageConfiguration,
      canAssign: user?.platformRole === "SUPER_ADMIN" || user?.businessRole === "OWNER",
      isStaffScope: user?.businessRole === "STAFF"
    },
    localToday
  };
}
