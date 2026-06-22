import {
  assertBusinessManagement,
  assertBusinessWriteAccess
} from "@/features/auth/permissions";
import { normalizeEmail } from "@/features/auth/normalize-email";
import {
  attachCustomerProfileToVerifiedAccount,
  buildVerifiedCustomerLinkDataForEmail
} from "@/features/customers/claiming";
import { requireCustomerPortalAccount } from "@/features/customer-portal/server";
import {
  ACTIVE_MEMBERSHIP_STATUSES,
  MEMBERSHIP_PAYMENT_PROVIDERS,
  MEMBERSHIP_PAYMENT_STATUSES,
  MEMBERSHIP_STATUSES,
  calculateMembershipEndDate,
  getEffectiveMembershipStatus,
  isMembershipCancelable,
  isMembershipRenewable
} from "@/features/memberships/lifecycle";
import { normalizeMembershipSlug } from "@/features/memberships/slug";
import { logBillingEvent } from "@/features/billing/logging";
import { getStripe } from "@/features/billing/stripe";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

const EXPIRING_WINDOW_DAYS = 14;
export const MEMBERSHIP_STRIPE_FLOW = "CUSTOMER_MEMBERSHIP";

const STRIPE_SUBSCRIPTION_TO_MEMBERSHIP_STATUS = {
  active: MEMBERSHIP_STATUSES.ACTIVE,
  trialing: MEMBERSHIP_STATUSES.ACTIVE,
  past_due: MEMBERSHIP_STATUSES.PAST_DUE,
  unpaid: MEMBERSHIP_STATUSES.PAST_DUE,
  canceled: MEMBERSHIP_STATUSES.CANCELED,
  incomplete_expired: MEMBERSHIP_STATUSES.EXPIRED,
  incomplete: MEMBERSHIP_STATUSES.PENDING,
  paused: MEMBERSHIP_STATUSES.PAST_DUE
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

function getStripeRecurringForPlan(plan) {
  if (plan.billingInterval === "WEEKLY") {
    return {
      interval: "week",
      interval_count: 1
    };
  }

  if (plan.billingInterval === "MONTHLY") {
    return {
      interval: "month",
      interval_count: 1
    };
  }

  if (plan.billingInterval === "QUARTERLY") {
    return {
      interval: "month",
      interval_count: 3
    };
  }

  if (plan.billingInterval === "YEARLY") {
    return {
      interval: "year",
      interval_count: 1
    };
  }

  return null;
}

function getMembershipCheckoutMode(plan) {
  return getStripeRecurringForPlan(plan) ? "subscription" : "payment";
}

export const membershipPlanSelect = {
  id: true,
  businessId: true,
  serviceId: true,
  name: true,
  slug: true,
  description: true,
  features: true,
  priceCents: true,
  currency: true,
  billingInterval: true,
  durationDays: true,
  trialDays: true,
  maxActiveMembers: true,
  requiresPayment: true,
  isActive: true,
  sortOrder: true,
  stripePriceId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      memberships: true
    }
  }
};

export const membershipPaymentSelect = {
  id: true,
  businessId: true,
  customerId: true,
  planId: true,
  membershipId: true,
  amountCents: true,
  currency: true,
  status: true,
  provider: true,
  providerPaymentId: true,
  idempotencyKey: true,
  description: true,
  paidAt: true,
  failedAt: true,
  refundedAt: true,
  createdAt: true,
  updatedAt: true
};

export const customerMembershipSelect = {
  id: true,
  businessId: true,
  customerId: true,
  planId: true,
  status: true,
  startsAt: true,
  endsAt: true,
  nextBillingAt: true,
  autoRenew: true,
  cancelAtPeriodEnd: true,
  canceledAt: true,
  cancellationReason: true,
  expiredAt: true,
  renewedAt: true,
  renewalCount: true,
  planNameSnapshot: true,
  planPriceCentsSnapshot: true,
  planCurrencySnapshot: true,
  planIntervalSnapshot: true,
  planDurationDaysSnapshot: true,
  providerSubscriptionId: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      stripeCustomerId: true
    }
  },
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      timezone: true,
      currency: true
    }
  },
  plan: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      features: true,
      priceCents: true,
      currency: true,
      billingInterval: true,
      durationDays: true,
      trialDays: true,
      isActive: true
    }
  },
  payments: {
    orderBy: {
      createdAt: "desc"
    },
    take: 5,
    select: membershipPaymentSelect
  }
};

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export function getPlanListOrder() {
  return [{ sortOrder: "asc" }, { createdAt: "desc" }];
}

export async function requireMembershipBusiness(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before managing memberships.",
      409
    );
  }

  if (!isValidMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBusinessManagement(user, businessId);

  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      timezone: true,
      currency: true,
      locale: true
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  return {
    user,
    business
  };
}

export function assertMembershipWriteAccess(user, business) {
  assertBusinessWriteAccess(user, business);
}

export async function markExpiredMemberships({ businessId = null, customerIds = [] } = {}) {
  const now = new Date();

  await prisma.customerMembership.updateMany({
    where: {
      ...(businessId ? { businessId } : {}),
      ...(customerIds.length > 0
        ? {
            customerId: {
              in: customerIds
            }
          }
        : {}),
      status: MEMBERSHIP_STATUSES.ACTIVE,
      endsAt: {
        lt: now
      }
    },
    data: {
      status: MEMBERSHIP_STATUSES.EXPIRED,
      expiredAt: now
    }
  });
}

export function normalizeMembershipPlanInput(data, business) {
  return {
    name: data.name.trim(),
    slug: normalizeMembershipSlug(data.slug),
    description: data.description?.trim() || null,
    features: (data.features || [])
      .map((feature) => feature.trim())
      .filter(Boolean),
    priceCents: Number(data.priceCents),
    currency: data.currency || business.currency,
    billingInterval: data.billingInterval,
    durationDays: Number(data.durationDays),
    trialDays: Number(data.trialDays || 0),
    maxActiveMembers:
      data.maxActiveMembers === null || data.maxActiveMembers === undefined
        ? null
        : Number(data.maxActiveMembers),
    requiresPayment: Boolean(data.requiresPayment),
    isActive: data.isActive !== false,
    sortOrder: Number(data.sortOrder || 0)
  };
}

export function mapMembershipPlan(plan) {
  return {
    ...plan,
    memberCount: plan._count?.memberships ?? 0,
    _count: undefined
  };
}

export function mapCustomerMembership(membership, now = new Date()) {
  const effectiveStatus = getEffectiveMembershipStatus(membership, now);

  return {
    ...membership,
    effectiveStatus,
    canRenew: isMembershipRenewable({
      ...membership,
      status: effectiveStatus
    }),
    canCancel: isMembershipCancelable({
      ...membership,
      status: effectiveStatus
    })
  };
}

export async function findTenantMembershipPlan({
  businessId,
  planId,
  select = membershipPlanSelect
}) {
  if (!isValidMongoObjectId(planId)) {
    return null;
  }

  return prisma.membershipPlan.findFirst({
    where: {
      id: planId,
      businessId
    },
    select
  });
}

async function assertPlanCapacity(plan) {
  if (!plan.maxActiveMembers) {
    return;
  }

  const activeMemberCount = await prisma.customerMembership.count({
    where: {
      planId: plan.id,
      status: {
        in: ACTIVE_MEMBERSHIP_STATUSES
      },
      endsAt: {
        gte: new Date()
      }
    }
  });

  if (activeMemberCount >= plan.maxActiveMembers) {
    throw new AppError("This membership plan is currently full.", 409);
  }
}

async function assertCustomerCanPurchaseMembership({ customerId, planId }) {
  const existingActiveMembership = await prisma.customerMembership.findFirst({
    where: {
      customerId,
      planId,
      status: {
        in: ACTIVE_MEMBERSHIP_STATUSES
      },
      endsAt: {
        gte: new Date()
      }
    },
    select: {
      id: true
    }
  });

  if (existingActiveMembership) {
    throw new AppError("This customer already has an active membership for that plan.", 409);
  }
}

async function upsertMembershipCustomer({ business, input }) {
  const email = normalizeEmail(input.customerEmail);
  const verifiedCustomerLinkData =
    await buildVerifiedCustomerLinkDataForEmail(email);
  const customer = await prisma.customer.upsert({
    where: {
      businessId_email: {
        businessId: business.id,
        email
      }
    },
    create: {
      businessId: business.id,
      name: input.customerName.trim(),
      email,
      phone: input.customerPhone?.trim() || null,
      timezone: business.timezone,
      locale: business.locale,
      ...verifiedCustomerLinkData
    },
    update: {
      name: input.customerName.trim(),
      phone: input.customerPhone?.trim() || undefined
    },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      phone: true,
      stripeCustomerId: true
    }
  });

  if (
    verifiedCustomerLinkData.userId &&
    customer.userId !== verifiedCustomerLinkData.userId
  ) {
    await attachCustomerProfileToVerifiedAccount({
      customerId: customer.id,
      email
    });
  }

  return customer;
}

async function ensureStripeCustomerForMembership({
  business,
  customer,
  context = {}
}) {
  const stripe = getStripe();

  if (customer.stripeCustomerId) {
    try {
      const stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId);

      if (!stripeCustomer.deleted) {
        return customer.stripeCustomerId;
      }
    } catch (error) {
      if (error?.code !== "resource_missing" && error?.statusCode !== 404) {
        throw error;
      }

      logBillingEvent(
        "stripe.membership_customer.missing",
        {
          ...context,
          businessId: business.id,
          customerId: customer.id,
          stripeCustomerId: customer.stripeCustomerId
        },
        "warn"
      );
    }
  }

  const stripeCustomer = await stripe.customers.create({
    email: customer.email,
    name: customer.name,
    phone: customer.phone || undefined,
    metadata: {
      flow: MEMBERSHIP_STRIPE_FLOW,
      businessId: business.id,
      customerId: customer.id
    }
  });

  await prisma.customer.update({
    where: {
      id: customer.id
    },
    data: {
      stripeCustomerId: stripeCustomer.id
    }
  });

  logBillingEvent("stripe.membership_customer.created", {
    ...context,
    businessId: business.id,
    customerId: customer.id,
    stripeCustomerId: stripeCustomer.id
  });

  return stripeCustomer.id;
}

function buildMembershipLineItem(plan, mode) {
  if (plan.stripePriceId) {
    return {
      price: plan.stripePriceId,
      quantity: 1
    };
  }

  const recurring = mode === "subscription"
    ? getStripeRecurringForPlan(plan)
    : null;

  return {
    price_data: {
      currency: plan.currency,
      unit_amount: plan.priceCents,
      product_data: {
        name: plan.name,
        description: plan.description || undefined,
        metadata: {
          flow: MEMBERSHIP_STRIPE_FLOW,
          businessId: plan.businessId,
          planId: plan.id
        }
      },
      ...(recurring ? { recurring } : {})
    },
    quantity: 1
  };
}

function buildMembershipMetadata({ business, plan, customer }) {
  return {
    flow: MEMBERSHIP_STRIPE_FLOW,
    businessId: business.id,
    planId: plan.id,
    customerId: customer.id
  };
}

async function findExistingPaymentReplay({ businessId, idempotencyKey }) {
  const payment = await prisma.membershipPayment.findUnique({
    where: {
      businessId_idempotencyKey: {
        businessId,
        idempotencyKey
      }
    },
    select: {
      ...membershipPaymentSelect,
      membership: {
        select: customerMembershipSelect
      }
    }
  });

  if (!payment?.membership) {
    return null;
  }

  return {
    membership: mapCustomerMembership(payment.membership),
    payment,
    idempotentReplay: true
  };
}

export async function createCustomerMembership({
  business,
  input
}) {
  const replay = await findExistingPaymentReplay({
    businessId: business.id,
    idempotencyKey: input.idempotencyKey
  });

  if (replay) {
    return replay;
  }

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: input.planId,
      businessId: business.id,
      isActive: true
    },
    select: {
      ...membershipPlanSelect,
      _count: false
    }
  });

  if (!plan) {
    throw new NotFoundError("Active membership plan not found.");
  }

  await assertPlanCapacity(plan);
  const customer = await upsertMembershipCustomer({ business, input });
  await assertCustomerCanPurchaseMembership({
    customerId: customer.id,
    planId: plan.id
  });

  const startsAt = new Date();
  const endsAt = calculateMembershipEndDate(startsAt, plan);
  const provider = input.paymentProvider || MEMBERSHIP_PAYMENT_PROVIDERS.MANUAL;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const membership = await transaction.customerMembership.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          planId: plan.id,
          status: MEMBERSHIP_STATUSES.ACTIVE,
          startsAt,
          endsAt,
          nextBillingAt: null,
          autoRenew: false,
          planNameSnapshot: plan.name,
          planPriceCentsSnapshot: plan.priceCents,
          planCurrencySnapshot: plan.currency,
          planIntervalSnapshot: plan.billingInterval,
          planDurationDaysSnapshot: plan.durationDays
        },
        select: customerMembershipSelect
      });

      const payment = await transaction.membershipPayment.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          planId: plan.id,
          membershipId: membership.id,
          amountCents: plan.priceCents,
          currency: plan.currency,
          status: MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED,
          provider,
          idempotencyKey: input.idempotencyKey,
          description: `Membership activation for ${plan.name}`,
          paidAt: startsAt
        },
        select: membershipPaymentSelect
      });

      return {
        membership,
        payment
      };
    });

    return {
      membership: mapCustomerMembership(result.membership),
      payment: result.payment,
      idempotentReplay: false
    };
  } catch (error) {
    if (error?.code === "P2002") {
      const replayed = await findExistingPaymentReplay({
        businessId: business.id,
        idempotencyKey: input.idempotencyKey
      });

      if (replayed) {
        return replayed;
      }
    }

    throw error;
  }
}

export async function createMembershipCheckoutSession({
  business,
  input,
  baseUrl,
  context = {}
}) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(
      "Stripe webhooks must be configured before starting membership checkout.",
      503
    );
  }

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: input.planId,
      businessId: business.id,
      isActive: true
    },
    select: {
      ...membershipPlanSelect,
      _count: false
    }
  });

  if (!plan) {
    throw new NotFoundError("Active membership plan not found.");
  }

  await assertPlanCapacity(plan);
  const customer = await upsertMembershipCustomer({ business, input });
  await assertCustomerCanPurchaseMembership({
    customerId: customer.id,
    planId: plan.id
  });

  if (!plan.requiresPayment || plan.priceCents <= 0) {
    const result = await createCustomerMembership({
      business,
      input: {
        ...input,
        paymentProvider: MEMBERSHIP_PAYMENT_PROVIDERS.MANUAL
      }
    });

    return {
      ...result,
      checkout: null,
      message: "Membership activated."
    };
  }

  const stripe = getStripe();
  const stripeCustomerId = await ensureStripeCustomerForMembership({
    business,
    customer,
    context
  });
  const mode = getMembershipCheckoutMode(plan);
  const metadata = buildMembershipMetadata({ business, plan, customer });
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const checkoutSession = await stripe.checkout.sessions.create(
    {
      mode,
      customer: stripeCustomerId,
      client_reference_id: customer.id,
      line_items: [buildMembershipLineItem(plan, mode)],
      customer_update: {
        address: "auto",
        name: "auto"
      },
      billing_address_collection: "auto",
      success_url: `${normalizedBaseUrl}/${business.slug}?membership=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${normalizedBaseUrl}/${business.slug}?membership=canceled`,
      metadata,
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata
            }
          }
        : {
            payment_intent_data: {
              metadata
            }
          })
    },
    {
      idempotencyKey: `membership-checkout:${business.id}:${customer.id}:${plan.id}:${input.idempotencyKey}`
    }
  );

  logBillingEvent("stripe.membership_checkout.created", {
    ...context,
    businessId: business.id,
    customerId: customer.id,
    planId: plan.id,
    stripeCustomerId,
    checkoutSessionId: checkoutSession.id,
    checkoutMode: mode
  });

  return {
    checkout: {
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      mode
    },
    message: "Stripe Checkout session created."
  };
}

async function createOrUpdateMembershipFromStripe({
  session,
  subscription = null,
  invoice = null,
  context = {}
}) {
  const metadata = subscription?.metadata || session.metadata || {};
  const businessId = metadata.businessId;
  const planId = metadata.planId;
  const customerId = metadata.customerId || session.client_reference_id;
  const checkoutSessionId = session.id;
  const providerSubscriptionId = getStripeId(session.subscription || subscription?.id);
  const invoiceId = getStripeId(session.invoice || invoice?.id);
  const paymentIntentId = getStripeId(session.payment_intent || invoice?.payment_intent);

  if (!businessId || !planId || !customerId) {
    throw new AppError("Membership checkout metadata is incomplete.", 422);
  }

  const [business, plan, customer] = await Promise.all([
    prisma.business.findUnique({
      where: {
        id: businessId
      },
      select: {
        id: true,
        slug: true,
        status: true,
        timezone: true,
        locale: true
      }
    }),
    prisma.membershipPlan.findFirst({
      where: {
        id: planId,
        businessId
      },
      select: {
        ...membershipPlanSelect,
        _count: false
      }
    }),
    prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId
      },
      select: {
        id: true,
        businessId: true
      }
    })
  ]);

  if (!business || !plan || !customer) {
    throw new NotFoundError("Membership checkout target was not found.");
  }

  if (session.status !== "complete") {
    throw new AppError("Stripe Checkout has not completed yet.", 409);
  }

  if (!["paid", "no_payment_required"].includes(session.payment_status)) {
    throw new AppError("Stripe has not confirmed payment for this membership checkout.", 409);
  }

  const period = subscription ? getStripeSubscriptionPeriod(subscription) : null;
  const startsAt = fromStripeTimestamp(period?.start) || new Date();
  const endsAt =
    fromStripeTimestamp(period?.end) ||
    calculateMembershipEndDate(startsAt, plan);
  const amountCents = session.amount_total ?? invoice?.amount_paid ?? plan.priceCents;
  const currency = session.currency || invoice?.currency || plan.currency;
  const paymentIdempotencyKey = invoiceId
    ? `stripe:invoice:${invoiceId}`
    : `stripe:checkout:${checkoutSessionId}`;
  const providerPaymentId = invoiceId || paymentIntentId || checkoutSessionId;

  const result = await prisma.$transaction(async (transaction) => {
    let membership = await transaction.customerMembership.findFirst({
      where: {
        businessId,
        customerId,
        planId,
        ...(providerSubscriptionId
          ? {
              OR: [
                {
                  providerSubscriptionId
                },
                {
                  status: {
                    in: ACTIVE_MEMBERSHIP_STATUSES
                  },
                  endsAt: {
                    gte: new Date()
                  }
                }
              ]
            }
          : {
              status: {
                in: ACTIVE_MEMBERSHIP_STATUSES
              },
              endsAt: {
                gte: new Date()
              }
            })
      },
      select: {
        id: true,
        renewalCount: true
      }
    });
    const existingPayment = await transaction.membershipPayment.findUnique({
      where: {
        businessId_idempotencyKey: {
          businessId,
          idempotencyKey: paymentIdempotencyKey
        }
      },
      select: {
        id: true,
        status: true
      }
    });
    const shouldCountRenewal =
      Boolean(membership) &&
      existingPayment?.status !== MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED;

    const membershipData = {
      businessId,
      customerId,
      planId,
      status: MEMBERSHIP_STATUSES.ACTIVE,
      startsAt,
      endsAt,
      nextBillingAt: null,
      autoRenew: Boolean(providerSubscriptionId),
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
      canceledAt: null,
      cancellationReason: null,
      expiredAt: null,
      renewedAt: new Date(),
      planNameSnapshot: plan.name,
      planPriceCentsSnapshot: plan.priceCents,
      planCurrencySnapshot: plan.currency,
      planIntervalSnapshot: plan.billingInterval,
      planDurationDaysSnapshot: plan.durationDays,
      providerSubscriptionId
    };

    if (membership) {
      membership = await transaction.customerMembership.update({
        where: {
          id: membership.id
        },
        data: {
          ...membershipData,
          ...(shouldCountRenewal
            ? {
                renewalCount: {
                  increment: 1
                }
              }
            : {})
        },
        select: {
          id: true
        }
      });
    } else {
      membership = await transaction.customerMembership.create({
        data: {
          ...membershipData,
          renewalCount: 0
        },
        select: {
          id: true
        }
      });
    }

    const payment = await transaction.membershipPayment.upsert({
      where: {
        businessId_idempotencyKey: {
          businessId,
          idempotencyKey: paymentIdempotencyKey
        }
      },
      create: {
        businessId,
        customerId,
        planId,
        membershipId: membership.id,
        amountCents,
        currency,
        status: MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED,
        provider: MEMBERSHIP_PAYMENT_PROVIDERS.STRIPE,
        providerPaymentId,
        idempotencyKey: paymentIdempotencyKey,
        description: `Stripe membership payment for ${plan.name}`,
        paidAt: new Date(),
        metadata: {
          checkoutSessionId,
          invoiceId,
          paymentIntentId,
          providerSubscriptionId
        }
      },
      update: {
        membershipId: membership.id,
        amountCents,
        currency,
        status: MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED,
        providerPaymentId,
        paidAt: new Date(),
        failedAt: null,
        metadata: {
          checkoutSessionId,
          invoiceId,
          paymentIntentId,
          providerSubscriptionId
        }
      },
      select: membershipPaymentSelect
    });

    const fullMembership = await transaction.customerMembership.findUnique({
      where: {
        id: membership.id
      },
      select: customerMembershipSelect
    });

    return {
      membership: fullMembership,
      payment
    };
  });

  logBillingEvent("stripe.membership.activated", {
    ...context,
    businessId,
    customerId,
    planId,
    membershipId: result.membership.id,
    checkoutSessionId,
    providerSubscriptionId,
    providerPaymentId
  });

  return {
    membership: mapCustomerMembership(result.membership),
    payment: result.payment
  };
}

export async function activateMembershipFromStripeCheckout(session, context = {}) {
  let subscription = null;
  let invoice = null;

  const subscriptionId = getStripeId(session.subscription);
  const invoiceId = getStripeId(session.invoice);

  if (subscriptionId) {
    subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice", "items.data.price"]
    });
    invoice = subscription.latest_invoice && typeof subscription.latest_invoice !== "string"
      ? subscription.latest_invoice
      : null;
  } else if (invoiceId) {
    invoice = await getStripe().invoices.retrieve(invoiceId);
  }

  return createOrUpdateMembershipFromStripe({
    session,
    subscription,
    invoice,
    context
  });
}

export async function reconcileMembershipCheckoutSession({
  business,
  sessionId,
  context = {}
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "subscription.latest_invoice"]
  });

  if (session.metadata?.flow !== MEMBERSHIP_STRIPE_FLOW) {
    throw new AppError("Checkout Session is not a membership checkout.", 422);
  }

  if (session.metadata.businessId !== business.id) {
    throw new AppError("Checkout Session does not belong to this business.", 403);
  }

  const result = await createOrUpdateMembershipFromStripe({
    session,
    subscription:
      session.subscription && typeof session.subscription !== "string"
        ? session.subscription
        : null,
    invoice:
      session.subscription &&
      typeof session.subscription !== "string" &&
      session.subscription.latest_invoice &&
      typeof session.subscription.latest_invoice !== "string"
        ? session.subscription.latest_invoice
        : null,
    context: {
      ...context,
      checkoutSessionId: session.id
    }
  });

  logBillingEvent("stripe.membership_checkout.reconciled", {
    ...context,
    businessId: business.id,
    checkoutSessionId: session.id,
    membershipId: result.membership?.id,
    paymentId: result.payment?.id
  });

  return {
    checkoutSessionId: session.id,
    membership: result.membership,
    payment: result.payment
  };
}

export async function syncStripeMembershipSubscription(subscription, context = {}) {
  if (subscription.metadata?.flow !== MEMBERSHIP_STRIPE_FLOW) {
    return null;
  }

  const membership = await prisma.customerMembership.findFirst({
    where: {
      providerSubscriptionId: subscription.id
    },
    select: {
      id: true,
      businessId: true
    }
  });

  if (!membership) {
    logBillingEvent(
      "stripe.membership_subscription.missing_local_membership",
      {
        ...context,
        subscriptionId: subscription.id
      },
      "warn"
    );

    return null;
  }

  const period = getStripeSubscriptionPeriod(subscription);
  const status =
    STRIPE_SUBSCRIPTION_TO_MEMBERSHIP_STATUS[subscription.status] ||
    MEMBERSHIP_STATUSES.PENDING;
  const updatedMembership = await prisma.customerMembership.update({
    where: {
      id: membership.id
    },
    data: {
      status,
      endsAt:
        fromStripeTimestamp(period.end) ||
        undefined,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      canceledAt: fromStripeTimestamp(subscription.canceled_at),
      expiredAt:
        status === MEMBERSHIP_STATUSES.EXPIRED ? new Date() : undefined
    },
    select: customerMembershipSelect
  });

  logBillingEvent("stripe.membership_subscription.synced", {
    ...context,
    businessId: membership.businessId,
    membershipId: membership.id,
    subscriptionId: subscription.id,
    membershipStatus: status
  });

  return mapCustomerMembership(updatedMembership);
}

export async function syncStripeMembershipInvoicePayment(invoice, context = {}) {
  const subscriptionId = getStripeId(
    invoice.subscription ||
      invoice.parent?.subscription_details?.subscription
  );

  if (!subscriptionId) {
    return null;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"]
  });

  if (subscription.metadata?.flow !== MEMBERSHIP_STRIPE_FLOW) {
    return null;
  }

  const membership = await prisma.customerMembership.findFirst({
    where: {
      providerSubscriptionId: subscription.id
    },
    select: customerMembershipSelect
  });

  if (!membership) {
    logBillingEvent(
      "stripe.membership_invoice.missing_local_membership",
      {
        ...context,
        invoiceId: invoice.id,
        subscriptionId: subscription.id
      },
      "warn"
    );

    return {
      membership: null,
      payment: null
    };
  }

  const period = getStripeSubscriptionPeriod(subscription);
  const endsAt =
    fromStripeTimestamp(period.end) ||
    calculateMembershipEndDate(new Date(), membership.plan);
  const paymentIdempotencyKey = `stripe:invoice:${invoice.id}`;
  const existingPayment = await prisma.membershipPayment.findUnique({
    where: {
      businessId_idempotencyKey: {
        businessId: membership.businessId,
        idempotencyKey: paymentIdempotencyKey
      }
    },
    select: {
      id: true,
      status: true
    }
  });
  const shouldCountRenewal =
    existingPayment?.status !== MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED;
  const payment = await prisma.membershipPayment.upsert({
    where: {
      businessId_idempotencyKey: {
        businessId: membership.businessId,
        idempotencyKey: paymentIdempotencyKey
      }
    },
    create: {
      businessId: membership.businessId,
      customerId: membership.customerId,
      planId: membership.planId,
      membershipId: membership.id,
      amountCents: invoice.amount_paid || membership.planPriceCentsSnapshot,
      currency: invoice.currency || membership.planCurrencySnapshot,
      status: MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED,
      provider: MEMBERSHIP_PAYMENT_PROVIDERS.STRIPE,
      providerPaymentId: getStripeId(invoice.payment_intent) || invoice.id,
      idempotencyKey: paymentIdempotencyKey,
      description: `Stripe membership invoice for ${membership.planNameSnapshot}`,
      paidAt: new Date()
    },
    update: {
      status: MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED,
      paidAt: new Date(),
      failedAt: null
    },
    select: membershipPaymentSelect
  });
  const updatedMembership = await prisma.customerMembership.update({
    where: {
      id: membership.id
    },
    data: {
      status: MEMBERSHIP_STATUSES.ACTIVE,
      endsAt,
      renewedAt: new Date(),
      ...(shouldCountRenewal
        ? {
            renewalCount: {
              increment: 1
            }
          }
        : {})
    },
    select: customerMembershipSelect
  });

  logBillingEvent("stripe.membership_invoice.paid", {
    ...context,
    businessId: membership.businessId,
    membershipId: membership.id,
    invoiceId: invoice.id,
    paymentId: payment.id
  });

  return {
    membership: mapCustomerMembership(updatedMembership),
    payment
  };
}

export async function syncStripeMembershipInvoiceFailure(invoice, context = {}) {
  const subscriptionId = getStripeId(
    invoice.subscription ||
      invoice.parent?.subscription_details?.subscription
  );

  if (!subscriptionId) {
    return null;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"]
  });

  if (subscription.metadata?.flow !== MEMBERSHIP_STRIPE_FLOW) {
    return null;
  }

  const membership = await prisma.customerMembership.findFirst({
    where: {
      providerSubscriptionId: subscription.id
    },
    select: customerMembershipSelect
  });

  if (!membership) {
    logBillingEvent(
      "stripe.membership_invoice_failed.missing_local_membership",
      {
        ...context,
        invoiceId: invoice.id,
        subscriptionId: subscription.id
      },
      "warn"
    );

    return {
      membership: null,
      payment: null
    };
  }

  const payment = await prisma.membershipPayment.upsert({
    where: {
      businessId_idempotencyKey: {
        businessId: membership.businessId,
        idempotencyKey: `stripe:invoice-failed:${invoice.id}`
      }
    },
    create: {
      businessId: membership.businessId,
      customerId: membership.customerId,
      planId: membership.planId,
      membershipId: membership.id,
      amountCents: invoice.amount_due || membership.planPriceCentsSnapshot,
      currency: invoice.currency || membership.planCurrencySnapshot,
      status: MEMBERSHIP_PAYMENT_STATUSES.FAILED,
      provider: MEMBERSHIP_PAYMENT_PROVIDERS.STRIPE,
      providerPaymentId: getStripeId(invoice.payment_intent) || invoice.id,
      idempotencyKey: `stripe:invoice-failed:${invoice.id}`,
      description: `Failed Stripe membership invoice for ${membership.planNameSnapshot}`,
      failedAt: new Date()
    },
    update: {
      status: MEMBERSHIP_PAYMENT_STATUSES.FAILED,
      failedAt: new Date()
    },
    select: membershipPaymentSelect
  });
  const updatedMembership = await prisma.customerMembership.update({
    where: {
      id: membership.id
    },
    data: {
      status: MEMBERSHIP_STATUSES.PAST_DUE
    },
    select: customerMembershipSelect
  });

  logBillingEvent("stripe.membership_invoice.failed", {
    ...context,
    businessId: membership.businessId,
    membershipId: membership.id,
    invoiceId: invoice.id,
    paymentId: payment.id
  });

  return {
    membership: mapCustomerMembership(updatedMembership),
    payment
  };
}

export async function getBusinessMembershipPlans({ businessId }) {
  const plans = await prisma.membershipPlan.findMany({
    where: {
      businessId
    },
    orderBy: getPlanListOrder(),
    select: membershipPlanSelect
  });

  return plans.map(mapMembershipPlan);
}

export async function getBusinessMemberships({ business, status = "ALL", search = "" }) {
  await markExpiredMemberships({ businessId: business.id });

  const where = {
    businessId: business.id,
    ...(status !== "ALL" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { planNameSnapshot: { contains: search, mode: "insensitive" } },
            {
              customer: {
                is: {
                  name: { contains: search, mode: "insensitive" }
                }
              }
            },
            {
              customer: {
                is: {
                  email: { contains: search, mode: "insensitive" }
                }
              }
            }
          ]
        }
      : {})
  };

  const memberships = await prisma.customerMembership.findMany({
    where,
    orderBy: {
      updatedAt: "desc"
    },
    take: 100,
    select: customerMembershipSelect
  });

  return memberships.map(mapCustomerMembership);
}

export async function getMembershipAnalytics({ business }) {
  await markExpiredMemberships({ businessId: business.id });
  const now = new Date();
  const expiringUntil = new Date(now);
  expiringUntil.setUTCDate(expiringUntil.getUTCDate() + EXPIRING_WINDOW_DAYS);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalMembers,
    activeMembers,
    pendingMembers,
    pastDueMembers,
    canceledMembers,
    expiredMembers,
    expiringSoon,
    payments,
    plans
  ] = await Promise.all([
    prisma.customerMembership.count({ where: { businessId: business.id } }),
    prisma.customerMembership.count({
      where: { businessId: business.id, status: MEMBERSHIP_STATUSES.ACTIVE }
    }),
    prisma.customerMembership.count({
      where: { businessId: business.id, status: MEMBERSHIP_STATUSES.PENDING }
    }),
    prisma.customerMembership.count({
      where: { businessId: business.id, status: MEMBERSHIP_STATUSES.PAST_DUE }
    }),
    prisma.customerMembership.count({
      where: { businessId: business.id, status: MEMBERSHIP_STATUSES.CANCELED }
    }),
    prisma.customerMembership.count({
      where: { businessId: business.id, status: MEMBERSHIP_STATUSES.EXPIRED }
    }),
    prisma.customerMembership.count({
      where: {
        businessId: business.id,
        status: MEMBERSHIP_STATUSES.ACTIVE,
        endsAt: {
          gte: now,
          lte: expiringUntil
        }
      }
    }),
    prisma.membershipPayment.findMany({
      where: {
        businessId: business.id,
        status: MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED
      },
      select: {
        amountCents: true,
        currency: true,
        paidAt: true,
        plan: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.membershipPlan.findMany({
      where: {
        businessId: business.id
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: {
          select: {
            memberships: true
          }
        }
      }
    })
  ]);

  const revenueTotalCents = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const revenueThisMonthCents = payments
    .filter((payment) => payment.paidAt && new Date(payment.paidAt) >= monthStart)
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const revenueByPlan = payments.reduce((acc, payment) => {
    const planId = payment.plan?.id || "unknown";
    const existing = acc[planId] || {
      planId,
      planName: payment.plan?.name || "Unknown plan",
      revenueCents: 0,
      paymentCount: 0
    };
    existing.revenueCents += payment.amountCents;
    existing.paymentCount += 1;
    acc[planId] = existing;
    return acc;
  }, {});

  return {
    currency: business.currency,
    totalMembers,
    activeMembers,
    pendingMembers,
    pastDueMembers,
    canceledMembers,
    expiredMembers,
    expiringSoon,
    revenueTotalCents,
    revenueThisMonthCents,
    plans: plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      isActive: plan.isActive,
      memberCount: plan._count.memberships,
      revenueCents: revenueByPlan[plan.id]?.revenueCents || 0,
      paymentCount: revenueByPlan[plan.id]?.paymentCount || 0
    })),
    revenueByPlan: Object.values(revenueByPlan)
  };
}

export async function getCustomerMemberships() {
  const { user, profiles, customerIds } = await requireCustomerPortalAccount();

  if (customerIds.length === 0) {
    return {
      user,
      profiles,
      activeMemberships: [],
      membershipHistory: [],
      summary: {
        active: 0,
        total: 0,
        expiringSoon: 0
      }
    };
  }

  await markExpiredMemberships({ customerIds });
  const now = new Date();
  const expiringUntil = new Date(now);
  expiringUntil.setUTCDate(expiringUntil.getUTCDate() + EXPIRING_WINDOW_DAYS);

  const memberships = await prisma.customerMembership.findMany({
    where: {
      customerId: {
        in: customerIds
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    select: customerMembershipSelect
  });
  const mappedMemberships = memberships.map((membership) =>
    mapCustomerMembership(membership, now)
  );
  const activeMemberships = mappedMemberships.filter(
    (membership) => membership.effectiveStatus === MEMBERSHIP_STATUSES.ACTIVE
  );

  return {
    user,
    profiles,
    activeMemberships,
    membershipHistory: mappedMemberships.filter(
      (membership) => membership.effectiveStatus !== MEMBERSHIP_STATUSES.ACTIVE
    ),
    summary: {
      active: activeMemberships.length,
      total: mappedMemberships.length,
      expiringSoon: activeMemberships.filter(
        (membership) => new Date(membership.endsAt) <= expiringUntil
      ).length
    }
  };
}

export async function getCustomerMembershipContext({ membershipId }) {
  const { user, profiles, customerIds } = await requireCustomerPortalAccount();

  if (!isValidMongoObjectId(membershipId) || customerIds.length === 0) {
    throw new NotFoundError("Membership not found.");
  }

  await markExpiredMemberships({ customerIds });
  const membership = await prisma.customerMembership.findFirst({
    where: {
      id: membershipId,
      customerId: {
        in: customerIds
      }
    },
    select: customerMembershipSelect
  });

  if (!membership) {
    throw new NotFoundError("Membership not found.");
  }

  return {
    user,
    profiles,
    membership: mapCustomerMembership(membership)
  };
}

export async function renewCustomerMembership({
  membershipId,
  input
}) {
  const { membership } = await getCustomerMembershipContext({ membershipId });

  if (!membership.canRenew) {
    throw new AppError("This membership cannot be renewed.", 409);
  }

  const replay = await findExistingPaymentReplay({
    businessId: membership.businessId,
    idempotencyKey: input.idempotencyKey
  });

  if (replay) {
    return replay;
  }

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: membership.planId,
      businessId: membership.businessId
    },
    select: {
      ...membershipPlanSelect,
      _count: false
    }
  });

  if (!plan) {
    throw new NotFoundError("Membership plan not found.");
  }

  await assertPlanCapacity(plan);
  const now = new Date();
  const currentEndsAt = new Date(membership.endsAt);
  const renewalStartsAt =
    currentEndsAt.getTime() > now.getTime() &&
    membership.effectiveStatus === MEMBERSHIP_STATUSES.ACTIVE
      ? currentEndsAt
      : now;
  const renewedUntil = calculateMembershipEndDate(renewalStartsAt, plan);
  const provider = input.paymentProvider || MEMBERSHIP_PAYMENT_PROVIDERS.MANUAL;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const updatedMembership = await transaction.customerMembership.update({
        where: {
          id: membership.id
        },
        data: {
          status: MEMBERSHIP_STATUSES.ACTIVE,
          endsAt: renewedUntil,
          nextBillingAt: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          cancellationReason: null,
          expiredAt: null,
          renewedAt: now,
          renewalCount: {
            increment: 1
          },
          planNameSnapshot: plan.name,
          planPriceCentsSnapshot: plan.priceCents,
          planCurrencySnapshot: plan.currency,
          planIntervalSnapshot: plan.billingInterval,
          planDurationDaysSnapshot: plan.durationDays
        },
        select: customerMembershipSelect
      });

      const payment = await transaction.membershipPayment.create({
        data: {
          businessId: membership.businessId,
          customerId: membership.customerId,
          planId: plan.id,
          membershipId: membership.id,
          amountCents: plan.priceCents,
          currency: plan.currency,
          status: MEMBERSHIP_PAYMENT_STATUSES.SUCCEEDED,
          provider,
          idempotencyKey: input.idempotencyKey,
          description: `Membership renewal for ${plan.name}`,
          paidAt: now
        },
        select: membershipPaymentSelect
      });

      return {
        membership: updatedMembership,
        payment
      };
    });

    return {
      membership: mapCustomerMembership(result.membership),
      payment: result.payment,
      idempotentReplay: false,
      message: "Membership renewed."
    };
  } catch (error) {
    if (error?.code === "P2002") {
      const replayed = await findExistingPaymentReplay({
        businessId: membership.businessId,
        idempotencyKey: input.idempotencyKey
      });

      if (replayed) {
        return replayed;
      }
    }

    throw error;
  }
}

export async function cancelCustomerMembership({
  membershipId,
  input
}) {
  const { membership } = await getCustomerMembershipContext({ membershipId });

  if (!membership.canCancel) {
    throw new AppError("This membership cannot be canceled.", 409);
  }

  const updatedMembership = await prisma.customerMembership.update({
    where: {
      id: membership.id
    },
    data: {
      status: MEMBERSHIP_STATUSES.CANCELED,
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
      cancellationReason: input.reason?.trim() || null,
      nextBillingAt: null
    },
    select: customerMembershipSelect
  });

  return {
    membership: mapCustomerMembership(updatedMembership),
    message: "Membership canceled."
  };
}

export async function getPublicMembershipPlans({ businessSlug }) {
  const business = await prisma.business.findUnique({
    where: {
      slug: businessSlug
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      status: true,
      timezone: true,
      currency: true,
      locale: true
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  const plans = await prisma.membershipPlan.findMany({
    where: {
      businessId: business.id,
      isActive: true
    },
    orderBy: getPlanListOrder(),
    select: {
      ...membershipPlanSelect,
      _count: false
    }
  });

  return {
    business,
    plans
  };
}
