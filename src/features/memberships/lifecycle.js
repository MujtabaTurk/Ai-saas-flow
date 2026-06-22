export const MEMBERSHIP_STATUSES = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  EXPIRED: "EXPIRED"
};

export const MEMBERSHIP_PAYMENT_STATUSES = {
  PENDING: "PENDING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
};

export const MEMBERSHIP_PAYMENT_PROVIDERS = {
  MANUAL: "MANUAL",
  STRIPE: "STRIPE"
};

export const MEMBERSHIP_BILLING_INTERVALS = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
  CUSTOM: "CUSTOM"
};

export const ACTIVE_MEMBERSHIP_STATUSES = [
  MEMBERSHIP_STATUSES.ACTIVE,
  MEMBERSHIP_STATUSES.PAST_DUE
];

export function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + Number(days || 0));
  return result;
}

export function calculateMembershipEndDate(startDate, plan) {
  return addDays(startDate, plan.durationDays || 30);
}

export function getEffectiveMembershipStatus(membership, now = new Date()) {
  if (
    membership?.status === MEMBERSHIP_STATUSES.ACTIVE &&
    membership.endsAt &&
    new Date(membership.endsAt).getTime() < now.getTime()
  ) {
    return MEMBERSHIP_STATUSES.EXPIRED;
  }

  return membership?.status || MEMBERSHIP_STATUSES.PENDING;
}

export function isMembershipActive(membership, now = new Date()) {
  return getEffectiveMembershipStatus(membership, now) === MEMBERSHIP_STATUSES.ACTIVE;
}

export function isMembershipRenewable(membership) {
  return [
    MEMBERSHIP_STATUSES.ACTIVE,
    MEMBERSHIP_STATUSES.EXPIRED,
    MEMBERSHIP_STATUSES.CANCELED,
    MEMBERSHIP_STATUSES.PAST_DUE
  ].includes(getEffectiveMembershipStatus(membership));
}

export function isMembershipCancelable(membership) {
  return [
    MEMBERSHIP_STATUSES.PENDING,
    MEMBERSHIP_STATUSES.ACTIVE,
    MEMBERSHIP_STATUSES.PAST_DUE
  ].includes(getEffectiveMembershipStatus(membership));
}

export function getMembershipStatusVariant(status) {
  if (status === MEMBERSHIP_STATUSES.ACTIVE) {
    return "success";
  }

  if (
    status === MEMBERSHIP_STATUSES.PENDING ||
    status === MEMBERSHIP_STATUSES.PAST_DUE
  ) {
    return "warning";
  }

  if (status === MEMBERSHIP_STATUSES.CANCELED) {
    return "destructive";
  }

  return "outline";
}

export function getIntervalLabel(interval) {
  const labels = {
    WEEKLY: "week",
    MONTHLY: "month",
    QUARTERLY: "quarter",
    YEARLY: "year",
    CUSTOM: "term"
  };

  return labels[interval] || "term";
}
