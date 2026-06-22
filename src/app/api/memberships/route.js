import {
  getBusinessMemberships,
  getRequestedBusinessId,
  requireMembershipBusiness
} from "@/features/memberships/server";
import { MEMBERSHIP_STATUSES } from "@/features/memberships/lifecycle";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";
const STATUS_VALUES = Object.values(MEMBERSHIP_STATUSES);

export async function GET(request) {
  try {
    const { business } = await requireMembershipBusiness(
      getRequestedBusinessId(request)
    );
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    if (status !== "ALL" && !STATUS_VALUES.includes(status)) {
      return fail("Choose a valid membership status.", 422, {
        status: "Choose a valid membership status."
      });
    }

    if (search.length > 100) {
      return fail("Search must be 100 characters or fewer.", 422, {
        search: "Search must be 100 characters or fewer."
      });
    }

    const memberships = await getBusinessMemberships({
      business,
      status,
      search
    });

    return ok({ memberships });
  } catch (error) {
    return handleApiError(error);
  }
}
