import { getCustomerMemberships } from "@/features/memberships/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok(await getCustomerMemberships());
  } catch (error) {
    return handleApiError(error);
  }
}
