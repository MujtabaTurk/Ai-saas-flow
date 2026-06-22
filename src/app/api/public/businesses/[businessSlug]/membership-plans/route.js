import { getPublicMembershipPlans } from "@/features/memberships/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { businessSlug } = await params;
    const data = await getPublicMembershipPlans({ businessSlug });

    return ok({
      business: data.business,
      plans: data.plans
    });
  } catch (error) {
    return handleApiError(error);
  }
}
