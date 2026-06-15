import { getTenantBillingState } from "@/features/billing/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { requireCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = await requireCurrentUser();
    const businessId = new URL(request.url).searchParams.get("businessId");
    const billingState = await getTenantBillingState(user, businessId);

    return ok(billingState, {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
