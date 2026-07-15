import { BUSINESS_ROLES } from "@/constants/roles";
import { logBillingEvent } from "@/features/billing/logging";
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

function getStripeSubscriptionPeriod(subscription) {
  const item = subscription.items?.data?.[0] || null;

  return {
    start:
      subscription.current_period_start ||
      item?.current_period_start ||
      null,
    end:
      subscription.current_period_end ||
      item?.current_period_end ||
      null
  };
}

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(value || "");
}

function isMissingStripeResource(error) {
  return error?.code === "resource_missing" || error?.statusCode === 404;
}

async function retrieveStripeCustomer(customerId, context = {}) {
  if (!customerId) {
    return null;
  }

  try {
    const customer = await getStripe().customers.retrieve(customerId);

    if (customer.deleted) {
      logBillingEvent(
        "stripe.customer.deleted",
        {
          ...context,
          stripeCustomerId: customerId
        },
        "warn"
      );

      return null;
    }

    return customer;
  } catch (error) {
    if (isMissingStripeResource(error)) {
      logBillingEvent(
        "stripe.customer.missing",
        {
          ...context,
          stripeCustomerId: customerId
        },
        "warn"
      );

      return null;
    }

    throw error;
  }
}

function assertStripeCustomerOwnership(customer, businessId, context = {}) {
  const metadataBusinessId = customer?.metadata?.businessId;

  if (metadataBusinessId && metadataBusinessId !== businessId) {
    logBillingEvent(
      "stripe.customer.tenant_mismatch",
      {
        ...context,
        businessId,
        stripeCustomerId: customer.id,
        stripeMetadataBusinessId: metadataBusinessId
      },
      "error"
    );

    throw new AppError("Stripe customer does not match this business.", 409);
  }
}

async function ensureStripeCustomerMetadata(customer, business, context = {}) {
  assertStripeCustomerOwnership(customer, business.id, context);

  const metadata = customer.metadata || {};

  if (
    metadata.businessId === business.id &&
    metadata.businessSlug === business.slug &&
    metadata.ownerUserId === business.ownerId
  ) {
    return customer;
  }

  const updatedCustomer = await getStripe().customers.update(customer.id, {
    metadata: {
      businessId: business.id,
      businessSlug: business.slug,
      ownerUserId: business.ownerId
    }
  });

  logBillingEvent("stripe.customer.metadata_updated", {
    ...context,
    userId: context.userId || business.ownerId,
    businessId: business.id,
    stripeCustomerId: customer.id
  });

  return updatedCustomer;
}

function getStripeCustomerCompareAndSwapWhere(businessId, customerId) {
  if (customerId) {
    return {
      id: businessId,
      stripeCustomerId: customerId
    };
  }

  return {
    id: businessId,
    OR: [
      {
        stripeCustomerId: null
      },
      {
        stripeCustomerId: {
          isSet: false
        }
      }
    ]
  };
}

async function findStripeCustomersForBusiness(business, context = {}) {
  const stripe = getStripe();
  const customers = new Map();

  try {
    const searchResult = await stripe.customers.search({
      query: `metadata['businessId']:'${business.id}'`,
      limit: 100
    });

    for (const customer of searchResult.data) {
      if (!customer.deleted && customer.metadata?.businessId === business.id) {
        customers.set(customer.id, customer);
      }
    }
  } catch (error) {
    logBillingEvent(
      "stripe.customer.search_failed",
      {
        ...context,
        businessId: business.id,
        errorMessage: error?.message
      },
      "warn"
    );

    if (!business.email) {
      throw error;
    }
  }

  if (business.email) {
    const listResult = await stripe.customers.list({
      email: business.email,
      limit: 100
    });

    for (const customer of listResult.data) {
      if (!customer.deleted && customer.metadata?.businessId === business.id) {
        customers.set(customer.id, customer);
      }
    }
  }

  return [...customers.values()].sort(
    (left, right) => left.created - right.created
  );
}

async function chooseCanonicalStripeCustomer(customers, context = {}) {
  if (customers.length < 2) {
    return customers[0] || null;
  }

  const stripe = getStripe();
  const subscriptionResults = await Promise.all(
    customers.map(async (customer) => ({
      customer,
      subscriptions: await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 100
      })
    }))
  );
  const withLiveSubscription = subscriptionResults.find(
    ({ subscriptions }) =>
      subscriptions.data.some(
        (subscription) =>
          !["canceled", "incomplete_expired"].includes(subscription.status)
      )
  );
  const withSubscription = subscriptionResults.find(
    ({ subscriptions }) => subscriptions.data.length > 0
  );
  const canonicalCustomer =
    withLiveSubscription?.customer ||
    withSubscription?.customer ||
    customers[0];

  logBillingEvent(
    "stripe.customer.duplicates_detected",
    {
      ...context,
      stripeCustomerId: canonicalCustomer.id,
      duplicateStripeCustomerIds: customers.map((customer) => customer.id)
    },
    "warn"
  );

  return canonicalCustomer;
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

export async function getBillingBusinessForUser(
  user,
  requestedBusinessId = null,
  context = {}
) {
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
        take: 1,
        include: { platformPlan: true }
      }
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  logBillingEvent("billing.business.loaded", {
    ...context,
    userId: user.id,
    businessId: business.id,
    stripeCustomerId: business.stripeCustomerId,
    subscriptionId: business.subscriptions[0]?.stripeSubscriptionId || null
  });

  return business;
}

export async function linkStripeCustomerToBusiness(
  businessId,
  customerId,
  {
    replaceExisting = false,
    stripeCustomer = null,
    context = {}
  } = {}
) {
  if (!businessId || !customerId) {
    return null;
  }

  const incomingCustomer =
    stripeCustomer || (await retrieveStripeCustomer(customerId, context));

  if (!incomingCustomer) {
    throw new AppError(
      "The Stripe customer linked to this billing request no longer exists.",
      409
    );
  }

  assertStripeCustomerOwnership(incomingCustomer, businessId, context);

  const [conflictingBusiness, conflictingSubscription] = await Promise.all([
    prisma.business.findFirst({
      where: {
        stripeCustomerId: customerId,
        id: {
          not: businessId
        }
      },
      select: {
        id: true
      }
    }),
    prisma.subscription.findFirst({
      where: {
        stripeCustomerId: customerId,
        businessId: {
          not: businessId
        }
      },
      select: {
        id: true
      }
    })
  ]);

  if (conflictingBusiness || conflictingSubscription) {
    logBillingEvent(
      "stripe.customer.database_conflict",
      {
        ...context,
        businessId,
        stripeCustomerId: customerId,
        conflictingBusinessId: conflictingBusiness?.id,
        conflictingSubscriptionId: conflictingSubscription?.id
      },
      "error"
    );

    throw new AppError("Stripe customer does not match this business.", 409);
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId
      },
      select: {
        id: true,
        ownerId: true,
        stripeCustomerId: true
      }
    });

    if (!business) {
      throw new NotFoundError("Business not found for Stripe customer.");
    }

    if (business.stripeCustomerId === customerId) {
      logBillingEvent("stripe.customer.link_reused", {
        ...context,
        userId: context.userId || business.ownerId,
        businessId,
        stripeCustomerId: customerId
      });

      return customerId;
    }

    if (business.stripeCustomerId && !replaceExisting) {
      const currentCustomer = await retrieveStripeCustomer(
        business.stripeCustomerId,
        context
      );
      const currentCustomerBusinessId =
        currentCustomer?.metadata?.businessId;
      const currentCustomerBelongsToBusiness =
        currentCustomer &&
        (!currentCustomerBusinessId ||
          currentCustomerBusinessId === businessId);

      if (currentCustomerBelongsToBusiness) {
        logBillingEvent(
          "stripe.customer.link_preserved",
          {
            ...context,
            userId: context.userId || business.ownerId,
            businessId,
            stripeCustomerId: business.stripeCustomerId,
            ignoredStripeCustomerId: customerId
          },
          "warn"
        );

        return business.stripeCustomerId;
      }
    }

    logBillingEvent("stripe.customer.link_update_started", {
      ...context,
      userId: context.userId || business.ownerId,
      businessId,
      previousStripeCustomerId: business.stripeCustomerId,
      stripeCustomerId: customerId,
      attempt: attempt + 1
    });

    const result = await prisma.business.updateMany({
      where: getStripeCustomerCompareAndSwapWhere(
        businessId,
        business.stripeCustomerId
      ),
      data: {
        stripeCustomerId: customerId
      }
    });

    if (result.count === 1) {
      logBillingEvent("stripe.customer.link_updated", {
        ...context,
        userId: context.userId || business.ownerId,
        businessId,
        previousStripeCustomerId: business.stripeCustomerId,
        stripeCustomerId: customerId
      });

      return customerId;
    }

    logBillingEvent(
      "stripe.customer.link_conflict",
      {
        ...context,
        userId: context.userId || business.ownerId,
        businessId,
        previousStripeCustomerId: business.stripeCustomerId,
        stripeCustomerId: customerId,
        attempt: attempt + 1
      },
      "warn"
    );
  }

  throw new AppError(
    "The Stripe customer link changed while billing was being prepared. Please try again.",
    409
  );
}

export async function ensureStripeCustomerForBusiness(
  business,
  { createIfMissing = true, context = {} } = {}
) {
  const stripe = getStripe();
  const subscription = business.subscriptions?.[0] || null;
  const subscriptionHasStripeBilling = Boolean(
    subscription?.stripeSubscriptionId
  );
  const candidateCustomerIds = [
    ...(subscriptionHasStripeBilling
      ? [subscription?.stripeCustomerId, business.stripeCustomerId]
      : [business.stripeCustomerId, subscription?.stripeCustomerId])
  ].filter((customerId, index, values) => (
    customerId && values.indexOf(customerId) === index
  ));

  for (const customerId of candidateCustomerIds) {
    const customer = await retrieveStripeCustomer(customerId, context);

    if (!customer) {
      continue;
    }

    assertStripeCustomerOwnership(customer, business.id, context);

    logBillingEvent("stripe.customer.candidate_reused", {
      ...context,
      userId: context.userId || business.ownerId,
      businessId: business.id,
      stripeCustomerId: customerId,
      source:
        customerId === subscription?.stripeCustomerId
          ? "subscription"
          : "business"
    });

    const linkedCustomerId = await linkStripeCustomerToBusiness(
      business.id,
      customerId,
      {
        replaceExisting:
          subscriptionHasStripeBilling &&
          customerId === subscription.stripeCustomerId,
        stripeCustomer: customer,
        context
      }
    );
    const linkedCustomer =
      linkedCustomerId === customer.id
        ? customer
        : await retrieveStripeCustomer(linkedCustomerId, context);

    if (linkedCustomer) {
      await ensureStripeCustomerMetadata(linkedCustomer, business, context);
    }

    return linkedCustomerId;
  }

  const recoveredCustomers = await findStripeCustomersForBusiness(
    business,
    context
  );
  const recoveredCustomer = await chooseCanonicalStripeCustomer(
    recoveredCustomers,
    context
  );

  if (recoveredCustomer) {
    logBillingEvent("stripe.customer.recovered", {
      ...context,
      userId: context.userId || business.ownerId,
      businessId: business.id,
      stripeCustomerId: recoveredCustomer.id
    });

    const linkedCustomerId = await linkStripeCustomerToBusiness(
      business.id,
      recoveredCustomer.id,
      {
        stripeCustomer: recoveredCustomer,
        context
      }
    );

    await ensureStripeCustomerMetadata(recoveredCustomer, business, context);

    return linkedCustomerId;
  }

  if (!createIfMissing) {
    return null;
  }

  logBillingEvent("stripe.customer.create_started", {
    ...context,
    userId: context.userId || business.ownerId,
    businessId: business.id
  });

  const customer = await stripe.customers.create(
    {
      name: business.name,
      email: business.email || undefined,
      metadata: {
        businessId: business.id,
        businessSlug: business.slug,
        ownerUserId: business.ownerId
      }
    },
    {
      idempotencyKey: `business:${business.id}:customer`
    }
  );

  logBillingEvent("stripe.customer.created", {
    ...context,
    userId: context.userId || business.ownerId,
    businessId: business.id,
    stripeCustomerId: customer.id
  });

  return linkStripeCustomerToBusiness(business.id, customer.id, {
    stripeCustomer: customer,
    context
  });
}

export async function assertBusinessStripeCustomerLink(
  businessId,
  customerId,
  context = {}
) {
  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      ownerId: true,
      stripeCustomerId: true
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found for Stripe customer.");
  }

  if (business.stripeCustomerId !== customerId) {
    logBillingEvent(
      "stripe.customer.link_changed",
      {
        ...context,
        userId: context.userId || business.ownerId,
        businessId,
        expectedStripeCustomerId: customerId,
        stripeCustomerId: business.stripeCustomerId
      },
      "error"
    );

    throw new AppError(
      "The Stripe customer link changed while billing was being prepared. Please try again.",
      409
    );
  }

  return business;
}

export function serializeSubscription(subscription) {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    planCode: subscription.planCode,
    planId: subscription.platformPlanId,
    planName: subscription.platformPlan?.name || null,
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

async function getManagedBillingPlans(currentPlanCode) {
  const plans = await prisma.platformPlan.findMany({
    where: {
      OR: [
        { status: { in: ["ACTIVE", "INACTIVE"] } },
        ...(currentPlanCode ? [{ code: currentPlanCode }] : [])
      ]
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  if (plans.length === 0) {
    return getPlanCatalog();
  }

  return plans.map((plan) => ({
    code: plan.code,
    name: plan.name,
    monthlyPriceCents: plan.monthlyPriceCents,
    yearlyPriceCents: plan.yearlyPriceCents,
    description: plan.description,
    features: Array.isArray(plan.features) ? plan.features : [],
    trialDays: plan.trialDays,
    limits: plan.limits || {},
    aiFeatures: plan.aiFeatures || {},
    prioritySupport: plan.prioritySupport,
    highlighted: false,
    status: plan.status,
    stripePriceId: plan.stripePriceId
  }));
}

export async function buildBillingState({ business, serviceCount, bookingCount }) {
  const subscription = business.subscriptions[0] || null;
  const priceConfiguration = getStripePriceConfigurationStatus();
  const managedPlans = await getManagedBillingPlans(subscription?.planCode);
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
    plans: managedPlans.map((plan) => ({
      ...plan,
      stripeConfigured:
        plan.code === "TRIAL"
          ? true
          : Boolean(plan.stripePriceId || priceConfiguration[plan.code]),
      checkoutConfigured:
        plan.code === "TRIAL"
          ? false
          : stripeSecretConfigured &&
            webhookConfigured &&
            Boolean(plan.stripePriceId || priceConfiguration[plan.code]) &&
            plan.status === "ACTIVE"
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

export function getCheckoutIdempotencyKey(
  businessId,
  customerId,
  planCode,
  now = new Date()
) {
  const utcDay = now.toISOString().slice(0, 10);

  return `checkout:${businessId}:${customerId}:${planCode}:${utcDay}`;
}

export async function findReusableCheckoutSession({
  businessId,
  customerId,
  planCode,
  context = {}
}) {
  const sessions = await getStripe().checkout.sessions.list({
    customer: customerId,
    status: "open",
    limit: 100
  });
  const session = sessions.data.find(
    (candidate) =>
      candidate.mode === "subscription" &&
      candidate.status === "open" &&
      candidate.url &&
      candidate.metadata?.businessId === businessId &&
      candidate.metadata?.planCode === planCode
  );

  if (session) {
    logBillingEvent("stripe.checkout.reused", {
      ...context,
      businessId,
      stripeCustomerId: customerId,
      checkoutSessionId: session.id,
      subscriptionId: getStripeId(session.subscription)
    });
  }

  return session || null;
}

export async function getCheckoutPriceId(planCode) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(
      "Stripe webhooks must be configured before starting subscription checkout.",
      503
    );
  }

  const managedPlan = await prisma.platformPlan.findUnique({
    where: { code: planCode },
    select: { status: true, stripePriceId: true }
  });
  if (managedPlan && managedPlan.status !== "ACTIVE") {
    throw new AppError("This plan is not available for new subscriptions.", 409);
  }
  const priceId = managedPlan?.stripePriceId || getStripePriceIdForPlan(planCode);

  if (!priceId) {
    throw new AppError(`Stripe price is not configured for the ${planCode} plan.`, 503);
  }

  return priceId;
}

export async function syncStripeSubscription(
  subscription,
  {
    context = {},
    expectedBusinessId = null,
    expectedCustomerId = null
  } = {}
) {
  const customerId = getStripeId(subscription.customer);
  const price = getStripeSubscriptionPrice(subscription);
  const priceId = price?.id || null;
  const productId = getStripeId(price?.product);
  const metadataPlanCode = subscription.metadata?.planCode;
  const pricePlanCode = resolvePlanCodeFromStripePriceId(priceId);
  const planCode = pricePlanCode || metadataPlanCode;
  const period = getStripeSubscriptionPeriod(subscription);
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

  if (expectedCustomerId && customerId !== expectedCustomerId) {
    throw new AppError(
      "Checkout session and Stripe subscription customers do not match.",
      409
    );
  }

  if (expectedBusinessId && businessId !== expectedBusinessId) {
    throw new AppError(
      "Checkout session and Stripe subscription businesses do not match.",
      409
    );
  }

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

  if (
    pricePlanCode &&
    metadataPlanCode &&
    pricePlanCode !== metadataPlanCode
  ) {
    throw new AppError(
      "Stripe subscription price and plan metadata do not match.",
      409
    );
  }

  if (!planCode || !["TRIAL", "BASIC", "PRO"].includes(planCode)) {
    const dynamicPlan = planCode ? await prisma.platformPlan.findUnique({ where: { code: planCode }, select: { id: true } }) : null;
    if (!dynamicPlan) throw new AppError("Could not resolve ServiceFlow plan for Stripe subscription.", 422);
  }

  const platformPlan = await prisma.platformPlan.findUnique({
    where: { code: planCode },
    select: { id: true }
  });
  if (!platformPlan) {
    throw new AppError("Could not resolve ServiceFlow plan for Stripe subscription.", 422);
  }

  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      ownerId: true,
      stripeCustomerId: true
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found for Stripe subscription.");
  }

  const syncContext = {
    ...context,
    userId: context.userId || business.ownerId,
    businessId,
    stripeCustomerId: customerId,
    subscriptionId: subscription.id
  };

  logBillingEvent("stripe.subscription.sync_started", {
    ...syncContext,
    previousStripeCustomerId: business.stripeCustomerId
  });

  if (customerId) {
    await linkStripeCustomerToBusiness(businessId, customerId, {
      replaceExisting: true,
      context: syncContext
    });
  }

  const data = {
    businessId,
    platformPlanId: platformPlan.id,
    planCode,
    status: STRIPE_TO_LOCAL_STATUS[subscription.status] || "INCOMPLETE",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    stripeProductId: productId,
    latestInvoiceId: getStripeId(subscription.latest_invoice),
    currentPeriodStart: fromStripeTimestamp(period.start),
    currentPeriodEnd: fromStripeTimestamp(period.end),
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

  let localSubscription;

  if (existingSubscription) {
    if (existingSubscription.businessId !== businessId) {
      throw new AppError("Stripe subscription is already linked to another business.", 409);
    }

    localSubscription = await prisma.subscription.update({
      where: {
        id: existingSubscription.id
      },
      data
    });
  } else {
    const onboardingSubscription = await prisma.subscription.findFirst({
      where: {
        businessId,
        OR: [
          {
            stripeSubscriptionId: null
          },
          {
            stripeSubscriptionId: {
              isSet: false
            }
          }
        ]
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true
      }
    });

    localSubscription = onboardingSubscription
      ? await prisma.subscription.update({
          where: {
            id: onboardingSubscription.id
          },
          data
        })
      : await prisma.subscription.create({
          data
        });
  }

  if (
    planCode !== "TRIAL" &&
    ["ACTIVE", "TRIALING"].includes(localSubscription.status)
  ) {
    const retiredAt = new Date();
    const retirement = await prisma.subscription.updateMany({
      where: {
        businessId,
        id: {
          not: localSubscription.id
        },
        planCode: "TRIAL",
        status: "TRIALING",
        OR: [
          {
            stripeSubscriptionId: null
          },
          {
            stripeSubscriptionId: {
              isSet: false
            }
          }
        ]
      },
      data: {
        status: "CANCELED",
        cancelAtPeriodEnd: false,
        canceledAt: retiredAt,
        currentPeriodEnd: retiredAt,
        trialEndsAt: retiredAt
      }
    });

    if (retirement.count > 0) {
      logBillingEvent("stripe.subscription.onboarding_retired", {
        ...syncContext,
        retiredSubscriptionCount: retirement.count
      });
    }
  }

  logBillingEvent("stripe.subscription.synced", {
    ...syncContext,
    localSubscriptionId: localSubscription.id,
    subscriptionStatus: localSubscription.status
  });

  return localSubscription;
}

export async function retrieveAndSyncStripeSubscription(
  subscriptionId,
  options = {}
) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice", "items.data.price.product"]
  });

  return syncStripeSubscription(subscription, options);
}

export async function reconcileStripeCheckoutSession({
  business,
  sessionId,
  context = {}
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const sessionBusinessId =
    session.metadata?.businessId || session.client_reference_id;
  const customerId = getStripeId(session.customer);
  const subscriptionId = getStripeId(session.subscription);
  const reconciliationContext = {
    ...context,
    businessId: business.id,
    stripeCustomerId: customerId,
    checkoutSessionId: session.id,
    subscriptionId
  };

  logBillingEvent("stripe.checkout.reconciliation_started", {
    ...reconciliationContext,
    checkoutStatus: session.status,
    paymentStatus: session.payment_status
  });

  if (session.mode !== "subscription") {
    throw new AppError(
      "This Checkout Session is not a subscription checkout.",
      409
    );
  }

  if (session.status !== "complete") {
    throw new AppError("Stripe Checkout has not completed yet.", 409);
  }

  if (!["paid", "no_payment_required"].includes(session.payment_status)) {
    throw new AppError("Stripe has not confirmed payment for this checkout.", 409);
  }

  if (sessionBusinessId !== business.id) {
    throw new AppError(
      "This Checkout Session belongs to another business.",
      403
    );
  }

  if (!customerId || customerId !== business.stripeCustomerId) {
    throw new AppError(
      "Checkout Session customer does not match this business.",
      409
    );
  }

  if (!subscriptionId) {
    throw new AppError(
      "Stripe has not attached a subscription to this checkout.",
      409
    );
  }

  const subscription = await retrieveAndSyncStripeSubscription(
    subscriptionId,
    {
      context: reconciliationContext,
      expectedBusinessId: business.id,
      expectedCustomerId: customerId
    }
  );

  logBillingEvent("stripe.checkout.reconciled", {
    ...reconciliationContext,
    localSubscriptionId: subscription.id,
    planCode: subscription.planCode,
    subscriptionStatus: subscription.status
  });

  return {
    session,
    subscription
  };
}
