import { cancelCustomerMembership } from "@/features/memberships/server";
import { customerMembershipCancellationSchema } from "@/features/memberships/validation/membership-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { membershipId } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerMembershipCancellationSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the cancellation request.", 422, errors);
    }

    return ok(await cancelCustomerMembership({
      membershipId,
      input: data
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
