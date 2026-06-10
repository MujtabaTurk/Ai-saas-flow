import { DAYS_OF_WEEK } from "@/features/availability/constants";

export const availabilityOrder = [{ dayOfWeek: "asc" }, { startTime: "asc" }];

export const unavailableDateOrder = [{ startsAt: "asc" }];

export function buildAvailabilitySummary({ availability, timezone }) {
  const activeRanges = availability.filter((range) => range.isActive);
  const activeDayValues = new Set(activeRanges.map((range) => range.dayOfWeek));
  const closedDays = DAYS_OF_WEEK.filter((day) => !activeDayValues.has(day.value));
  const slotDurations = activeRanges.map((range) => range.slotDurationMin);

  return {
    timezone,
    totalRanges: availability.length,
    activeRanges: activeRanges.length,
    inactiveRanges: availability.length - activeRanges.length,
    workingDays: activeDayValues.size,
    closedDays: closedDays.length,
    closedDayValues: closedDays.map((day) => day.value),
    globalRanges: availability.filter((range) => !range.serviceId).length,
    serviceSpecificRanges: availability.filter((range) => range.serviceId).length,
    shortestSlotDurationMin: slotDurations.length ? Math.min(...slotDurations) : null,
    longestSlotDurationMin: slotDurations.length ? Math.max(...slotDurations) : null
  };
}

export function buildUnavailableDateSummary({ unavailableDates, now = new Date() }) {
  const upcomingDates = unavailableDates.filter((item) => new Date(item.endsAt) >= now);

  return {
    total: unavailableDates.length,
    upcoming: upcomingDates.length,
    fullDay: unavailableDates.filter((item) => item.isFullDay).length,
    partialDay: unavailableDates.filter((item) => !item.isFullDay).length,
    businessWide: unavailableDates.filter((item) => !item.serviceId).length,
    serviceSpecific: unavailableDates.filter((item) => item.serviceId).length,
    nextUnavailableAt: upcomingDates[0]?.startsAt || null
  };
}
