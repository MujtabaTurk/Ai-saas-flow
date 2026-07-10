import {
  getBillingBusinessForUser,
  reconcileStripeCheckoutSession,
  serializeSubscription
} from "@/features/billing/server";
import {
  getBillingRequestId,
  logBillingEvent
} from "@/features/billing/logging";
import { checkoutReconciliationSchema } from "@/features/billing/validation/billing-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateJsonRequest } from "@/lib/api/request";
import { requireCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request) {
  const requestId = getBillingRequestId(request);
  let userId = null;

  try {
    const user = await requireCurrentUser();
    userId = user.id;
    const { data, errors } = await validateJsonRequest(
      request,
      checkoutReconciliationSchema
    );

    if (errors) {
      const response = fail(
        "A valid Checkout Session is required.",
        422,
        errors
      );
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("x-request-id", requestId);

      return response;
    }

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
    const result = await reconcileStripeCheckoutSession({
      business,
      sessionId: data.sessionId,
      context
    });
    const response = ok({
      checkoutSessionId: result.session.id,
      subscription: serializeSubscription(result.subscription),
      requestId
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("x-request-id", requestId);

    return response;
  } catch (error) {
    logBillingEvent(
      "stripe.checkout.reconciliation_failed",
      {
        requestId,
        userId,
        errorMessage: error?.message
      },
      "error"
    );

    const response = handleApiError(error);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("x-request-id", requestId);

    return response;
  }
}
