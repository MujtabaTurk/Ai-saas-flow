export const BOOKING_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELED: "CANCELED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW"
};

export const BOOKING_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELED"],
  CANCELED: [],
  COMPLETED: [],
  NO_SHOW: []
};

export const DEFAULT_BOOKING_SETTINGS = {
  bookingLeadTimeMin: 120,
  bookingWindowDays: 30,
  cancellationWindowMin: 1440,
  allowGuestBookings: true,
  autoConfirmBookings: false
};

export const OCCUPANCY_BUCKET_MINUTES = 5;

