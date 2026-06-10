import {
  BOOKING_STATUSES,
  BOOKING_STATUS_TRANSITIONS,
  DEFAULT_BOOKING_SETTINGS
} from "@/features/bookings/constants";
import { AppError } from "@/lib/api/errors";

export function getBookingSettings(settings) {
  return {
    ...DEFAULT_BOOKING_SETTINGS,
    ...(settings || {})
  };
}

export function getCancellationDeadline(booking, settings) {
  const resolvedSettings = getBookingSettings(settings);
  return new Date(booking.startsAt.getTime() - resolvedSettings.cancellationWindowMin * 60 * 1000);
}

export function canCustomerCancelBooking(booking, settings, now = new Date()) {
  if (![BOOKING_STATUSES.PENDING, BOOKING_STATUSES.CONFIRMED].includes(booking.status)) {
    return false;
  }

  return now < getCancellationDeadline(booking, settings);
}

export function assertBookingTransition(booking, nextStatus, now = new Date()) {
  const allowedStatuses = BOOKING_STATUS_TRANSITIONS[booking.status] || [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new AppError(`Booking cannot move from ${booking.status} to ${nextStatus}.`, 409);
  }

  if (nextStatus === BOOKING_STATUSES.COMPLETED && now < booking.endsAt) {
    throw new AppError("A booking cannot be completed before its scheduled end time.", 409);
  }

  if (nextStatus === BOOKING_STATUSES.NO_SHOW && now < booking.startsAt) {
    throw new AppError("A booking cannot be marked no-show before its scheduled start time.", 409);
  }
}

export function getStatusTimestampData(nextStatus, now = new Date()) {
  if (nextStatus === BOOKING_STATUSES.CONFIRMED) {
    return { confirmedAt: now };
  }

  if (nextStatus === BOOKING_STATUSES.CANCELED) {
    return { canceledAt: now };
  }

  if (nextStatus === BOOKING_STATUSES.COMPLETED) {
    return { completedAt: now };
  }

  return {};
}

export function shouldReleaseOccupancy(nextStatus) {
  return [
    BOOKING_STATUSES.CANCELED,
    BOOKING_STATUSES.COMPLETED,
    BOOKING_STATUSES.NO_SHOW
  ].includes(nextStatus);
}

export function getOccupancyReleaseData(nextStatus) {
  if (!shouldReleaseOccupancy(nextStatus)) {
    return {};
  }

  return {
    occupancies: {
      deleteMany: {}
    }
  };
}
