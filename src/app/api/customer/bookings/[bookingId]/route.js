import { getCustomerBookingDetails } from "@/features/customer-portal/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { bookingId } = await params;

    return ok(await getCustomerBookingDetails({ bookingId }));
  } catch (error) {
    return handleApiError(error);
  }
}
