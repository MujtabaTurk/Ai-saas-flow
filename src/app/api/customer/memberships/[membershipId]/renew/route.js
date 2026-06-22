import { renewCustomerMembership } from "@/features/memberships/server";
import { customerMembershipRenewalSchema } from "@/features/memberships/validation/membership-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { membershipId } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerMembershipRenewalSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the renewal request.", 422, errors);
    }

    const result = await renewCustomerMembership({
      membershipId,
      input: data
    });

    return ok({
      ...result,
      message: result.message || "Membership renewed."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
