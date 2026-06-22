import {
  getPublicMembershipPlans,
  reconcileMembershipCheckoutSession
} from "@/features/memberships/server";
import { getBillingRequestId } from "@/features/billing/logging";
import { publicMembershipCheckoutReconciliationSchema } from "@/features/memberships/validation/membership-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const requestId = getBillingRequestId(request);

  try {
    const { businessSlug } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      publicMembershipCheckoutReconciliationSchema,
      payload || {}
    );

    if (errors) {
      const response = fail("A valid Checkout Session is required.", 422, errors);
      response.headers.set("x-request-id", requestId);

      return response;
    }

    const { business } = await getPublicMembershipPlans({ businessSlug });
    const response = ok(
      await reconcileMembershipCheckoutSession({
        business,
        sessionId: data.sessionId,
        context: {
          requestId
        }
      })
    );
    response.headers.set("x-request-id", requestId);

    return response;
  } catch (error) {
    const response = handleApiError(error);
    response.headers.set("x-request-id", requestId);

    return response;
  }
}
