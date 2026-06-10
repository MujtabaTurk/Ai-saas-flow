const dateTimeFormatterCache = new Map();

function getFormatter(timezone) {
  if (!dateTimeFormatterCache.has(timezone)) {
    dateTimeFormatterCache.set(
      timezone,
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
      })
    );
  }

  return dateTimeFormatterCache.get(timezone);
}

function getParts(date, timezone) {
  return getFormatter(timezone)
    .formatToParts(date)
    .reduce((parts, part) => {
      if (part.type !== "literal") {
        parts[part.type] = Number(part.value);
      }

      return parts;
    }, {});
}

function getTimezoneOffset(date, timezone) {
  const parts = getParts(date, timezone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return representedAsUtc - date.getTime();
}

export function zonedDateTimeToUtc(dateValue, timeValue, timezone) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const localTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcTimestamp = localTimestamp;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const offset = getTimezoneOffset(new Date(utcTimestamp), timezone);
    utcTimestamp = localTimestamp - offset;
  }

  return new Date(utcTimestamp);
}

export function addDaysToDateValue(dateValue, numberOfDays) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + numberOfDays));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function formatDateTimeInTimezone(value, timezone) {
  const parts = getParts(new Date(value), timezone);

  return {
    date: `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    time: `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`
  };
}

export function formatTimeRange(startTime, endTime) {
  return `${startTime} - ${endTime}`;
}

