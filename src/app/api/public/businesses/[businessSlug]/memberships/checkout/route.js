import {
  createMembershipCheckoutSession,
  getPublicMembershipPlans
} from "@/features/memberships/server";
import { getAppBaseUrl } from "@/features/billing/stripe";
import { getBillingRequestId } from "@/features/billing/logging";
import { publicMembershipEnrollmentSchema } from "@/features/memberships/validation/membership-schema";
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
      publicMembershipEnrollmentSchema,
      payload || {}
    );

    if (errors) {
      const response = fail("Please check the membership checkout form.", 422, errors);
      response.headers.set("x-request-id", requestId);

      return response;
    }

    const { business } = await getPublicMembershipPlans({ businessSlug });

    if (business.status !== "ACTIVE") {
      const response = fail("This business is not accepting new memberships.", 403);
      response.headers.set("x-request-id", requestId);

      return response;
    }

    const response = ok(
      await createMembershipCheckoutSession({
        business,
        input: data,
        baseUrl: getAppBaseUrl(request),
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
