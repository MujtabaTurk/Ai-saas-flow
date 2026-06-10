import { formatDateTimeInTimezone } from "@/features/availability/time";

export function isSameLocalCalendarDay(startsAt, endsAt, timezone) {
  const localStart = formatDateTimeInTimezone(startsAt, timezone);
  const localEnd = formatDateTimeInTimezone(endsAt, timezone);

  return localStart.date === localEnd.date;
}

