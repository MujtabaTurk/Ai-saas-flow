import { getCustomerBookings } from "@/features/customer-portal/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    return ok(
      await getCustomerBookings({
        scope: searchParams.get("scope") || "all",
        status: searchParams.get("status") || "ALL"
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
