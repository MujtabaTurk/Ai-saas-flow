import {
  formatDateTimeInTimezone,
  zonedDateTimeToUtc
} from "@/features/availability/time";
import { prisma } from "@/lib/prisma";

export async function buildCustomerSummary({
  business,
  filteredWhere,
  now = new Date()
}) {
  const localDate = formatDateTimeInTimezone(now, business.timezone).date;
  const monthStart = zonedDateTimeToUtc(
    `${localDate.slice(0, 7)}-01`,
    "00:00",
    business.timezone
  );
  const baseWhere = {
    businessId: business.id
  };

  const [
    filteredTotal,
    total,
    marketingOptedIn,
    withBookings,
    newThisMonth
  ] = await Promise.all([
    prisma.customer.count({
      where: filteredWhere
    }),
    prisma.customer.count({
      where: baseWhere
    }),
    prisma.customer.count({
      where: {
        ...baseWhere,
        marketingOptIn: true
      }
    }),
    prisma.customer.count({
      where: {
        ...baseWhere,
        bookings: {
          some: {}
        }
      }
    }),
    prisma.customer.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: monthStart
        }
      }
    })
  ]);

  return {
    filteredTotal,
    total,
    marketingOptedIn,
    withBookings,
    withoutBookings: total - withBookings,
    newThisMonth
  };
}
