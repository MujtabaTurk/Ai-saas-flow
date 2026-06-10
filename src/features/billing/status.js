export const ENTITLED_SUBSCRIPTION_STATUSES = ["TRIALING", "ACTIVE"];
export const STRIPE_MANAGED_SUBSCRIPTION_STATUSES = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "INCOMPLETE",
  "UNPAID",
  "PAUSED"
];

export function getSubscriptionEntitlement(subscription, now = new Date()) {
  const status = subscription?.status || null;
  const planCode = subscription?.planCode || null;
  const entitlementEnd =
    status === "TRIALING"
      ? subscription?.trialEndsAt || subscription?.currentPeriodEnd || null
      : subscription?.currentPeriodEnd || subscription?.trialEndsAt || null;
  const statusAllowsAccess = ENTITLED_SUBSCRIPTION_STATUSES.includes(status);
  const periodAllowsAccess = !entitlementEnd || entitlementEnd > now;
  const isEntitled = Boolean(subscription && statusAllowsAccess && periodAllowsAccess);

  let reason = null;

  if (!subscription) {
    reason = "MISSING_SUBSCRIPTION";
  } else if (!statusAllowsAccess) {
    reason = "STATUS_NOT_ENTITLED";
  } else if (!periodAllowsAccess) {
    reason = "PERIOD_EXPIRED";
  }

  return {
    isEntitled,
    reason,
    planCode,
    status,
    entitlementEnd
  };
}

export function isSubscriptionEntitled(subscription, now = new Date()) {
  return getSubscriptionEntitlement(subscription, now).isEntitled;
}

export function getSubscriptionStatusVariant(status) {
  if (status === "ACTIVE" || status === "TRIALING") {
    return "success";
  }

  if (status === "PAST_DUE" || status === "INCOMPLETE") {
    return "warning";
  }

  return "destructive";
}
