import {
  ensureStripeCustomerForBusiness,
  getBillingBusinessForUser
} from "@/features/billing/server";
import {
  getBillingRequestId,
  logBillingEvent
} from "@/features/billing/logging";
import { getAppBaseUrl, getStripe } from "@/features/billing/stripe";
import { isSuperAdmin } from "@/features/auth/permissions";
import { ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
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
    const businessId = new URL(request.url).searchParams.get("businessId");
    const business = await getBillingBusinessForUser(
      user,
      businessId,
      context
    );
    const customerId = await ensureStripeCustomerForBusiness(business, {
      createIfMissing: false,
      context
    });

    if (!customerId) {
      throw new AppError(
        "No active Stripe customer exists for this business. Start a new checkout to reconnect billing.",
        409
      );
    }

    const stripe = getStripe();
    logBillingEvent("stripe.portal.create_started", {
      ...context,
      businessId: business.id,
      stripeCustomerId: customerId
    });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppBaseUrl(request)}${
        isSuperAdmin(user) ? "/admin" : "/dashboard/billing"
      }`
    });

    logBillingEvent("stripe.portal.created", {
      ...context,
      businessId: business.id,
      stripeCustomerId: customerId,
      portalSessionId: portalSession.id
    });

    const response = ok({
      url: portalSession.url,
      requestId
    });
    response.headers.set("x-request-id", requestId);

    return response;
  } catch (error) {
    logBillingEvent(
      "stripe.portal.failed",
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
