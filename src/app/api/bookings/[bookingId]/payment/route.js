import { updateOwnerBookingPayment } from "@/features/bookings/payment";
import {
  assertBookingOperationalAccess,
  findTenantBooking,
  getRequestedBusinessId,
  requireBookingContext
} from "@/features/bookings/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { business, user } = await requireBookingContext(getRequestedBusinessId(request));
    const { bookingId } = await params;
    const booking = await findTenantBooking({ businessId: business.id, bookingId, select: { id: true, businessId: true, assignedMemberId: true } });
    if (!booking) return fail("Booking not found.", 404);
    assertBookingOperationalAccess(user, booking);
    const body = await request.json().catch(() => ({}));
    const result = await updateOwnerBookingPayment({
      bookingId,
      businessId: business.id,
      actorUserId: user.id,
      action: body.action,
      notes: body.notes
    });
    return ok({ ...result, message: result.payment.status === "SUCCEEDED" ? "Payment confirmed." : "Payment marked as unpaid." });
  } catch (error) {
    return handleApiError(error);
  }
}
