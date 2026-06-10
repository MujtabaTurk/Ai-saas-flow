import { BUSINESS_ROLES } from "@/constants/roles";
import { getPlanCatalog } from "@/features/billing/plan-catalog";
import {
  getMissingStripePriceKeys,
  getStripePriceConfigurationStatus,
  getStripePriceIdForPlan,
  resolvePlanCodeFromStripePriceId
} from "@/features/billing/stripe-price-map";
import { getStripe } from "@/features/billing/stripe";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import { isSuperAdmin } from "@/features/auth/permissions";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

const STRIPE_TO_LOCAL_STATUS = {
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
  unpaid: "UNPAID",
  paused: "PAUSED"
};

function fromStripeTimestamp(value) {
  return value ? new Date(value * 1000) : null;
}

function getStripeId(value) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getStripeSubscriptionPrice(subscription) {
  return subscription.items?.data?.[0]?.price || null;
}

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(value || "");
}

export function assertBillingManagement(user, businessId) {
  if (!user || !businessId) {
    throw new ForbiddenError("Billing access is required.");
  }

  const canManage =
    isSuperAdmin(user) ||
    (user.activeBusinessId === businessId && user.businessRole === BUSINESS_ROLES.OWNER);

  if (!canManage) {
    throw new ForbiddenError("Only the business owner can manage billing.");
  }
}

export async function getBillingBusinessForUser(user, requestedBusinessId = null) {
  const businessId = requestedBusinessId || user?.activeBusinessId;

  if (!businessId) {
    throw new AppError("Business onboarding is required before managing billing.", 409);
  }

  if (!isMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBillingManagement(user, businessId);

  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      ownerId: true,
      name: true,
      slug: true,
      email: true,
      stripeCustomerId: true,
      status: true,
      subscriptions: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  return business;
}

export async function linkStripeCustomerToBusiness(businessId, customerId) {
  if (!businessId || !customerId) {
    return;
  }

  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      stripeCustomerId: true
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found for Stripe customer.");
  }

  if (business.stripeCustomerId && business.stripeCustomerId !== customerId) {
    throw new AppError("Stripe customer does not match this business.", 409);
  }

  if (!business.stripeCustomerId) {
    const result = await prisma.business.updateMany({
      where: {
        id: businessId,
        stripeCustomerId: null
      },
      data: {
        stripeCustomerId: customerId
      }
    });

    if (result.count === 0) {
      const currentBusiness = await prisma.business.findUnique({
        where: {
          id: businessId
        },
        select: {
          stripeCustomerId: true
        }
      });

      if (currentBusiness?.stripeCustomerId !== customerId) {
        throw new AppError("Stripe customer does not match this business.", 409);
      }
    }
  }
}

export async function ensureStripeCustomerForBusiness(business) {
  const stripe = getStripe();

  if (business.stripeCustomerId) {
    return business.stripeCustomerId;
  }

  const customer = await stripe.customers.create(
    {
      name: business.name,
      email: business.email || undefined,
      metadata: {
        businessId: business.id,
        businessSlug: business.slug
      }
    },
    {
      idempotencyKey: `business:${business.id}:customer`
    }
  );

  await linkStripeCustomerToBusiness(business.id, customer.id);

  return customer.id;
}

export function serializeSubscription(subscription) {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    planCode: subscription.planCode,
    status: subscription.status,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripePriceId: subscription.stripePriceId,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    trialEndsAt: subscription.trialEndsAt,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
    lastPaymentAt: subscription.lastPaymentAt,
    lastPaymentFailedAt: subscription.lastPaymentFailedAt
  };
}

export function buildBillingState({ business, serviceCount, bookingCount }) {
  const subscription = business.subscriptions[0] || null;
  const priceConfiguration = getStripePriceConfigurationStatus();
  const stripeSecretConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const missingConfiguration = [
    ...(!stripeSecretConfigured ? ["STRIPE_SECRET_KEY"] : []),
    ...(!webhookConfigured ? ["STRIPE_WEBHOOK_SECRET"] : []),
    ...getMissingStripePriceKeys()
  ];
  const entitlement = getSubscriptionEntitlement(subscription);

  return {
    business: {
      id: business.id,
      name: business.name,
      status: business.status,
      hasStripeCustomer: Boolean(
        business.stripeCustomerId || subscription?.stripeCustomerId
      )
    },
    subscription: serializeSubscription(subscription),
    entitlement,
    usage: {
      services: serviceCount,
      bookings: bookingCount
    },
    plans: getPlanCatalog().map((plan) => ({
      ...plan,
      stripeConfigured:
        plan.code === "TRIAL" ? true : Boolean(priceConfiguration[plan.code]),
      checkoutConfigured:
        plan.code === "TRIAL"
          ? false
          : stripeSecretConfigured &&
            webhookConfigured &&
            Boolean(priceConfiguration[plan.code])
    })),
    billingConfigured: missingConfiguration.length === 0,
    stripeSecretConfigured,
    webhookConfigured,
    missingConfiguration
  };
}

export async function getTenantBillingState(user, requestedBusinessId = null) {
  const business = await getBillingBusinessForUser(user, requestedBusinessId);
  const subscription = business.subscriptions[0] || null;
  const [serviceCount, bookingCount] = await Promise.all([
    prisma.service.count({
      where: {
        businessId: business.id
      }
    }),
    prisma.booking.count({
      where: {
        businessId: business.id,
        ...(subscription?.currentPeriodStart || subscription?.trialEndsAt
          ? {
              createdAt: {
                ...(subscription.currentPeriodStart
                  ? { gte: subscription.currentPeriodStart }
                  : {}),
                ...(subscription.currentPeriodEnd || subscription.trialEndsAt
                  ? { lt: subscription.currentPeriodEnd || subscription.trialEndsAt }
                  : {})
              }
            }
          : {})
      }
    })
  ]);

  return buildBillingState({
    business,
    serviceCount,
    bookingCount
  });
}

export function getCheckoutPriceId(planCode) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(
      "Stripe webhooks must be configured before starting subscription checkout.",
      503
    );
  }

  const priceId = getStripePriceIdForPlan(planCode);

  if (!priceId) {
    throw new AppError(`Stripe price is not configured for the ${planCode} plan.`, 503);
  }

  return priceId;
}

export async function syncStripeSubscription(subscription) {
  const customerId = getStripeId(subscription.customer);
  const price = getStripeSubscriptionPrice(subscription);
  const priceId = price?.id || null;
  const productId = getStripeId(price?.product);
  const metadataPlanCode = subscription.metadata?.planCode;
  const planCode = priceId
    ? resolvePlanCodeFromStripePriceId(priceId)
    : metadataPlanCode;
  const metadataBusinessId = subscription.metadata?.businessId || null;
  const customerBusiness = customerId
    ? await prisma.business.findFirst({
        where: {
          stripeCustomerId: customerId
        },
        select: {
          id: true
        }
      })
    : null;
  const businessId = metadataBusinessId || customerBusiness?.id || null;

  if (
    metadataBusinessId &&
    customerBusiness &&
    metadataBusinessId !== customerBusiness.id
  ) {
    throw new AppError("Stripe subscription tenant metadata is inconsistent.", 409);
  }

  if (!businessId) {
    throw new AppError("Could not resolve business for Stripe subscription.", 422);
  }

  if (!planCode || !["TRIAL", "BASIC", "PRO"].includes(planCode)) {
    throw new AppError("Could not resolve ServiceFlow plan for Stripe subscription.", 422);
  }

  if (customerId) {
    await linkStripeCustomerToBusiness(businessId, customerId);
  }

  const data = {
    businessId,
    planCode,
    status: STRIPE_TO_LOCAL_STATUS[subscription.status] || "INCOMPLETE",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    stripeProductId: productId,
    latestInvoiceId: getStripeId(subscription.latest_invoice),
    currentPeriodStart: fromStripeTimestamp(subscription.current_period_start),
    currentPeriodEnd: fromStripeTimestamp(subscription.current_period_end),
    trialEndsAt: fromStripeTimestamp(subscription.trial_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    canceledAt: fromStripeTimestamp(subscription.canceled_at)
  };

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscription.id
    },
    select: {
      id: true,
      businessId: true
    }
  });

  if (existingSubscription) {
    if (existingSubscription.businessId !== businessId) {
      throw new AppError("Stripe subscription is already linked to another business.", 409);
    }

    return prisma.subscription.update({
      where: {
        id: existingSubscription.id
      },
      data
    });
  }

  const onboardingSubscription = await prisma.subscription.findFirst({
    where: {
      businessId,
      stripeSubscriptionId: null
    },
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true
    }
  });

  if (onboardingSubscription) {
    return prisma.subscription.update({
      where: {
        id: onboardingSubscription.id
      },
      data
    });
  }

  return prisma.subscription.create({
    data
  });
}

export async function retrieveAndSyncStripeSubscription(subscriptionId) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice", "items.data.price.product"]
  });

  return syncStripeSubscription(subscription);
}
