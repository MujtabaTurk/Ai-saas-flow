import {
  getMembershipAnalytics,
  getRequestedBusinessId,
  requireMembershipBusiness
} from "@/features/memberships/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { business } = await requireMembershipBusiness(
      getRequestedBusinessId(request)
    );

    return ok({
      analytics: await getMembershipAnalytics({ business })
    });
  } catch (error) {
    return handleApiError(error);
  }
}
