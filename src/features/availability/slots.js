import { DAYS_OF_WEEK } from "@/features/availability/constants";
import { zonedDateTimeToUtc } from "@/features/availability/time";

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function overlaps(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export function getDayOfWeek(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const dayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const orderedDayValues = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ];

  return orderedDayValues[dayIndex];
}

export function generateAvailableSlots({
  dateValue,
  timezone,
  service,
  availability,
  unavailableDates,
  bookings
}) {
  const serviceSpecificRanges = availability.filter((range) => range.serviceId === service.id);
  const ranges = serviceSpecificRanges.length > 0
    ? serviceSpecificRanges
    : availability.filter((range) => !range.serviceId);
  const slots = [];

  for (const range of ranges) {
    const windowStart = zonedDateTimeToUtc(dateValue, range.startTime, timezone);
    const windowEnd = zonedDateTimeToUtc(dateValue, range.endTime, timezone);
    const bufferBeforeMin = service.bufferBeforeMin + range.bufferBeforeMin;
    const bufferAfterMin = service.bufferAfterMin + range.bufferAfterMin;

    for (
      let candidateStart = windowStart;
      candidateStart < windowEnd;
      candidateStart = addMinutes(candidateStart, range.slotDurationMin)
    ) {
      const appointmentEnd = addMinutes(candidateStart, service.durationMin);
      const occupiedStart = addMinutes(candidateStart, -bufferBeforeMin);
      const occupiedEnd = addMinutes(appointmentEnd, bufferAfterMin);

      if (occupiedStart < windowStart || occupiedEnd > windowEnd) {
        continue;
      }

      const blockedByException = unavailableDates.some((exception) => {
        const appliesToService = !exception.serviceId || exception.serviceId === service.id;

        return appliesToService && overlaps(occupiedStart, occupiedEnd, exception.startsAt, exception.endsAt);
      });

      if (blockedByException) {
        continue;
      }

      const blockedByBooking = bookings.some((booking) => {
        const existingBufferBefore =
          booking.bufferBeforeMinSnapshot ?? booking.service?.bufferBeforeMin ?? 0;
        const existingBufferAfter =
          booking.bufferAfterMinSnapshot ?? booking.service?.bufferAfterMin ?? 0;
        const existingStart = addMinutes(booking.startsAt, -existingBufferBefore);
        const existingEnd = addMinutes(booking.endsAt, existingBufferAfter);

        return overlaps(occupiedStart, occupiedEnd, existingStart, existingEnd);
      });

      if (blockedByBooking) {
        continue;
      }

      slots.push({
        startsAt: candidateStart.toISOString(),
        endsAt: appointmentEnd.toISOString(),
        bufferBeforeMin,
        bufferAfterMin,
        timezone
      });
    }
  }

  const uniqueSlots = new Map(slots.map((slot) => [slot.startsAt, slot]));

  return [...uniqueSlots.values()].sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

export function getDayLabel(dayOfWeek) {
  return DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label || dayOfWeek;
}
