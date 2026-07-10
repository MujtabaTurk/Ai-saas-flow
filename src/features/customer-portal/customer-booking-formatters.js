import {
  formatLocalizedDateTime,
  formatLocalizedMoney
} from "@/i18n/format";

export function getCustomerBookingStatusVariant(status) {
  if (status === "CONFIRMED" || status === "COMPLETED") {
    return "success";
  }

  if (status === "PENDING") {
    return "warning";
  }

  if (status === "CANCELED" || status === "NO_SHOW") {
    return "destructive";
  }

  return "default";
}

export function formatCustomerBookingStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", " ");
}

export function getCustomerBookingDateValue(value, timezone) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(value));
  const partMap = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

export function formatCustomerBookingSlot(slot, language) {
  return formatLocalizedDateTime(slot.startsAt, slot.timezone, language, {
    timeStyle: "short"
  });
}

export function formatCustomerBookingAppointment(booking, language) {
  if (!booking) {
    return "";
  }

  return formatLocalizedDateTime(booking.startsAt, booking.timezone, language, {
    dateStyle: "full",
    timeStyle: "short"
  });
}

export function formatCustomerBookingPrice(booking, language) {
  if (!booking) {
    return "";
  }

  if (
    booking.servicePriceCentsSnapshot === null ||
    booking.servicePriceCentsSnapshot === undefined
  ) {
    return "Free";
  }

  return formatLocalizedMoney(
    booking.servicePriceCentsSnapshot,
    booking.serviceCurrencySnapshot,
    language
  );
}
