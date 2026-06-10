import { DEFAULT_TRIAL_DAYS } from "@/features/businesses/constants";

export const DEFAULT_BUSINESS_SETTINGS = {
  bookingLeadTimeMin: 120,
  bookingWindowDays: 30,
  cancellationWindowMin: 1440,
  allowGuestBookings: true,
  autoConfirmBookings: false
};

export const DEFAULT_BUSINESS_AVAILABILITY = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY"
].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 0,
  isActive: true
}));

export function buildTrialSubscription(now = new Date()) {
  const trialEndsAt = new Date(now.getTime() + DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  return {
    planCode: "TRIAL",
    status: "TRIALING",
    trialEndsAt,
    currentPeriodStart: now,
    currentPeriodEnd: trialEndsAt
  };
}
