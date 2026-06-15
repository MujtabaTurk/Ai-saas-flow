import { checkoutSessionSchema } from "@/features/billing/validation/billing-schema";
import {
  assertBusinessStripeCustomerLink,
  ensureStripeCustomerForBusiness,
  findReusableCheckoutSession,
  getBillingBusinessForUser,
  getCheckoutIdempotencyKey,
  getCheckoutPriceId
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
import { validateRequest } from "@/lib/api/validate-request";
import { requireCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

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
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(checkoutSessionSchema, payload || {});

    if (errors) {
      const response = fail("Please choose a billing plan.", 422, errors);
      response.headers.set("x-request-id", requestId);

      return response;
    }

    const businessId = new URL(request.url).searchParams.get("businessId");
    const business = await getBillingBusinessForUser(
      user,
      businessId,
      context
    );
    const currentSubscription = business.subscriptions[0] || null;

    if (
      currentSubscription?.stripeSubscriptionId &&
      STRIPE_MANAGED_SUBSCRIPTION_STATUSES.includes(currentSubscription.status)
    ) {
      throw new AppError("Manage your current subscription from the billing portal.", 409);
    }

    const priceId = getCheckoutPriceId(data.planCode);
    const stripe = getStripe();
    const customerId = await ensureStripeCustomerForBusiness(business, {
      context: {
        ...context,
        businessId: business.id
      }
    });
    const baseUrl = getAppBaseUrl(request);
    const returnPath = isSuperAdmin(user) ? "/admin" : "/dashboard/billing";
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

      const response = ok({
        url: reusableSession.url,
        sessionId: reusableSession.id,
        requestId
      });
      response.headers.set("x-request-id", requestId);

      return response;
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
      planCode: data.planCode
    });

    const checkoutSession = await stripe.checkout.sessions.create(
      {
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
          planCode: data.planCode
        },
        subscription_data: {
          metadata: {
            businessId: business.id,
            planCode: data.planCode
          }
        }
      },
      {
        idempotencyKey: stripeIdempotencyKey
      }
    );

    try {
      await assertBusinessStripeCustomerLink(
        business.id,
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
              businessId: business.id,
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
          businessId: business.id,
          stripeCustomerId: customerId,
          checkoutSessionId: checkoutSession.id
        },
        "warn"
      );

      throw linkError;
    }

    logBillingEvent("stripe.checkout.created", {
      ...context,
      businessId: business.id,
      stripeCustomerId: customerId,
      checkoutSessionId: checkoutSession.id,
      subscriptionId: checkoutSession.subscription || null,
      planCode: data.planCode
    });

    const response = ok({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      requestId
    });
    response.headers.set("x-request-id", requestId);

    return response;
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
    response.headers.set("x-request-id", requestId);

    return response;
  }
}
