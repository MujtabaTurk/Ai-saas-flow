import {
  createCustomerMembership,
  getPublicMembershipPlans
} from "@/features/memberships/server";
import { publicMembershipEnrollmentSchema } from "@/features/memberships/validation/membership-schema";
import { created, fail } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { businessSlug } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      publicMembershipEnrollmentSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the membership activation form.", 422, errors);
    }

    const { business } = await getPublicMembershipPlans({ businessSlug });

    if (business.status !== "ACTIVE") {
      return fail("This business is not accepting new memberships.", 403);
    }

    const result = await createCustomerMembership({
      business,
      input: data
    });

    return created({
      ...result,
      message: result.idempotentReplay
        ? "Membership already activated."
        : "Membership activated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
