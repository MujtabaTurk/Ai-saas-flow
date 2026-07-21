import { checkoutSessionSchema } from "@/features/billing/validation/billing-schema";
import {
  assertBusinessStripeCustomerLink,
  ensureStripeCustomerForBusiness,
  findReusableCheckoutSession,
  getBillingBusinessForUser,
  getCheckoutIdempotencyKey,
  getCheckoutPriceId,
  ensurePlatformPlan
} from "@/features/billing/server";
import {
  getBillingRequestId,
  logBillingEvent
} from "@/features/billing/logging";
import { getAppBaseUrl, getStripe } from "@/features/billing/stripe";
import { STRIPE_MANAGED_SUBSCRIPTION_STATUSES } from "@/features/billing/status";
import { isSuperAdmin } from "@/features/auth/permissions";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateJsonRequest } from "@/lib/api/request";
import { requireCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

function withRequestId(response, requestId) {
  response.headers.set("x-request-id", requestId);

  return response;
}

function hasManagedStripeSubscription(subscription) {
  return Boolean(
    subscription?.stripeSubscriptionId &&
      STRIPE_MANAGED_SUBSCRIPTION_STATUSES.includes(subscription.status)
  );
}

function getBillingReturnPath(user) {
  return isSuperAdmin(user) ? "/admin" : "/dashboard/billing";
}

function buildCheckoutSessionPayload({
  baseUrl,
  business,
  customerId,
  planCode,
  priceId,
  returnPath
}) {
  return {
    mode: "subscription",
    customer: customerId,
    client_reference_id: business.id,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    billing_address_collection: "auto",
    customer_update: {
      address: "auto",
      name: "auto"
    },
    allow_promotion_codes: true,
    success_url: `${baseUrl}${returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}${returnPath}?checkout=canceled`,
    metadata: {
      businessId: business.id,
      planCode
    },
    subscription_data: {
      metadata: {
        businessId: business.id,
        planCode
      }
    }
  };
}

function buildCheckoutResponse({ requestId, session }) {
  return withRequestId(
    ok({
      url: session.url,
      sessionId: session.id,
      requestId
    }),
    requestId
  );
}

async function assertCustomerLinkOrExpireCheckout({
  businessId,
  checkoutSession,
  context,
  customerId,
  stripe
}) {
  try {
    await assertBusinessStripeCustomerLink(
      businessId,
      customerId,
      context
    );
  } catch (linkError) {
    if (checkoutSession.status === "open") {
      try {
        await stripe.checkout.sessions.expire(checkoutSession.id);
      } catch (expireError) {
        logBillingEvent(
          "stripe.checkout.expire_failed",
          {
            ...context,
            businessId,
            stripeCustomerId: customerId,
            checkoutSessionId: checkoutSession.id,
            errorMessage: expireError?.message
          },
          "error"
        );
      }
    }

    logBillingEvent(
      "stripe.checkout.expired_after_customer_change",
      {
        ...context,
        businessId,
        stripeCustomerId: customerId,
        checkoutSessionId: checkoutSession.id
      },
      "warn"
    );

    throw linkError;
  }
}

export async function POST(request) {
  const requestId = getBillingRequestId(request);
  let userId = null;

  try {
    const user = await requireCurrentUser();
    userId = user.id;
    const context = {
      requestId,
      userId
    };
    const { data, errors } = await validateJsonRequest(
      request,
      checkoutSessionSchema
    );

    if (errors) {
      return withRequestId(
        fail("Please choose a billing plan.", 422, errors),
        requestId
      );
    }

    const businessId = new URL(request.url).searchParams.get("businessId");
    const business = await getBillingBusinessForUser(
      user,
      businessId,
      context
    );
    const currentSubscription = business.subscriptions[0] || null;

    if (hasManagedStripeSubscription(currentSubscription)) {
      throw new AppError("Manage your current subscription from the billing portal.", 409);
    }

    const platformPlan = await ensurePlatformPlan(data.planCode);
    const priceId = await getCheckoutPriceId(data.planCode);
    const stripe = getStripe();
    const customerId = await ensureStripeCustomerForBusiness(business, {
      context: {
        ...context,
        businessId: business.id
      }
    });
    const baseUrl = getAppBaseUrl(request);
    const returnPath = getBillingReturnPath(user);
    const reusableSession = await findReusableCheckoutSession({
      businessId: business.id,
      customerId,
      planCode: data.planCode,
      context
    });

    if (reusableSession) {
      await assertBusinessStripeCustomerLink(
        business.id,
        customerId,
        context
      );

      return buildCheckoutResponse({
        requestId,
        session: reusableSession
      });
    }

    const stripeIdempotencyKey = getCheckoutIdempotencyKey(
      business.id,
      customerId,
      data.planCode
    );

    await assertBusinessStripeCustomerLink(
      business.id,
      customerId,
      context
    );

    logBillingEvent("stripe.checkout.create_started", {
      ...context,
      businessId: business.id,
      stripeCustomerId: customerId,
      planId: platformPlan.id,
      planCode: data.planCode,
      stripePriceId: priceId
    });

    const checkoutSession = await stripe.checkout.sessions.create(
      buildCheckoutSessionPayload({
        baseUrl,
        business,
        customerId,
        planCode: data.planCode,
        priceId,
        returnPath
      }),
      {
        idempotencyKey: stripeIdempotencyKey
      }
    );

    await assertCustomerLinkOrExpireCheckout({
      businessId: business.id,
      checkoutSession,
      context,
      customerId,
      stripe
    });

    logBillingEvent("stripe.checkout.created", {
      ...context,
      businessId: business.id,
      stripeCustomerId: customerId,
      checkoutSessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
      subscriptionId: checkoutSession.subscription || null,
      planId: platformPlan.id,
      planCode: data.planCode,
      stripePriceId: priceId
    });

    return buildCheckoutResponse({
      requestId,
      session: checkoutSession
    });
  } catch (error) {
    logBillingEvent(
      "stripe.checkout.failed",
      {
        requestId,
        userId,
        errorMessage: error?.message
      },
      "error"
    );

    const response = handleApiError(error);

    return withRequestId(response, requestId);
  }
}
