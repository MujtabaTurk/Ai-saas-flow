import { addDaysToDateValue, formatDateTimeInTimezone, zonedDateTimeToUtc } from "@/features/availability/time";
import { generateAvailableSlots, getDayOfWeek } from "@/features/availability/slots";
import { getBookingSettings } from "@/features/bookings/lifecycle";
import { prisma } from "@/lib/prisma";

export async function getAvailableSlotsForBusiness({
  business,
  service,
  dateValue,
  now = new Date()
}) {
  const settings = getBookingSettings(business.settings);

  if (business.status !== "ACTIVE" || !service.isActive) {
    return [];
  }

  const today = formatDateTimeInTimezone(now, business.timezone).date;
  const lastBookableDate = addDaysToDateValue(today, settings.bookingWindowDays);

  if (dateValue < today || dateValue > lastBookableDate) {
    return [];
  }

  const dayOfWeek = getDayOfWeek(dateValue);
  const dayStart = zonedDateTimeToUtc(dateValue, "00:00", business.timezone);
  const nextDayStart = zonedDateTimeToUtc(addDaysToDateValue(dateValue, 1), "00:00", business.timezone);

  const [availability, unavailableDates, bookings] = await Promise.all([
    prisma.availability.findMany({
      where: {
        businessId: business.id,
        dayOfWeek,
        isActive: true,
        OR: [{ serviceId: null }, { serviceId: service.id }]
      },
      orderBy: {
        startTime: "asc"
      }
    }),
    prisma.unavailableDate.findMany({
      where: {
        businessId: business.id,
        startsAt: {
          lt: nextDayStart
        },
        endsAt: {
          gt: dayStart
        },
        OR: [{ serviceId: null }, { serviceId: service.id }]
      },
      select: {
        serviceId: true,
        startsAt: true,
        endsAt: true
      }
    }),
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        status: {
          in: ["PENDING", "CONFIRMED"]
        },
        startsAt: {
          lt: nextDayStart
        },
        endsAt: {
          gt: dayStart
        }
      },
      select: {
        startsAt: true,
        endsAt: true,
        bufferBeforeMinSnapshot: true,
        bufferAfterMinSnapshot: true
      }
    })
  ]);

  const earliestStart = new Date(now.getTime() + settings.bookingLeadTimeMin * 60 * 1000);
  const slots = generateAvailableSlots({
    dateValue,
    timezone: business.timezone,
    service,
    availability,
    unavailableDates,
    bookings
  });

  return slots.filter((slot) => new Date(slot.startsAt) >= earliestStart);
}
