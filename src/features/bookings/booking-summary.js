import { formatDateTimeInTimezone, zonedDateTimeToUtc, addDaysToDateValue } from "@/features/availability/time";
import { BOOKING_STATUSES } from "@/features/bookings/constants";
import { getBookingLimit } from "@/features/bookings/policy";
import { prisma } from "@/lib/prisma";

const ACTIVE_BOOKING_STATUSES = [BOOKING_STATUSES.PENDING, BOOKING_STATUSES.CONFIRMED];

function getSubscriptionPeriod(subscription) {
  return {
    start: subscription?.currentPeriodStart || new Date(0),
    end: subscription?.currentPeriodEnd || subscription?.trialEndsAt || new Date("9999-12-31")
  };
}

export async function buildBookingSummary({
  business,
  filteredWhere,
  now = new Date()
}) {
  const subscription = business.subscriptions?.[0] || null;
  const { start: planPeriodStart, end: planPeriodEnd } = getSubscriptionPeriod(subscription);
  const bookingLimit = getBookingLimit(subscription?.planCode);
  const localToday = formatDateTimeInTimezone(now, business.timezone).date;
  const todayStart = zonedDateTimeToUtc(localToday, "00:00", business.timezone);
  const tomorrowStart = zonedDateTimeToUtc(addDaysToDateValue(localToday, 1), "00:00", business.timezone);
  const baseWhere = {
    businessId: business.id
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
        ...baseWhere,
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
      code: subscription?.planCode || null,
      status: subscription?.status || null,
      limit: bookingLimit,
      used: planUsed,
      remaining: bookingLimit === null ? null : Math.max(bookingLimit - planUsed, 0),
      periodStart: planPeriodStart,
      periodEnd: planPeriodEnd
    },
    localToday
  };
}
