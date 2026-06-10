import {
  addDaysToDateValue,
  zonedDateTimeToUtc
} from "@/features/availability/time";

export function createUnavailablePeriod(data, timezone) {
  const startsAt = zonedDateTimeToUtc(data.date, data.isFullDay ? "00:00" : data.startTime, timezone);
  const endDate = data.isFullDay ? addDaysToDateValue(data.date, 1) : data.date;
  const endsAt = zonedDateTimeToUtc(endDate, data.isFullDay ? "00:00" : data.endTime, timezone);

  return {
    serviceId: data.serviceId || null,
    startsAt,
    endsAt,
    reason: data.reason?.trim() || null,
    isFullDay: Boolean(data.isFullDay)
  };
}
