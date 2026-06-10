import { assertBusinessManagement } from "@/features/auth/permissions";
import {
  assertBookingTransition,
  getOccupancyReleaseData,
  getStatusTimestampData
} from "@/features/bookings/lifecycle";
import { bookingSelect } from "@/features/bookings/server";
import { bookingStatusSchema } from "@/features/bookings/validation/booking-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.activeBusinessId) {
      return fail("Business access is required.", 401);
    }

    const { bookingId } = await params;
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        businessId: session.user.activeBusinessId
      },
      select: bookingSelect
    });

    if (!booking) {
      return fail("Booking not found.", 404);
    }

    assertBusinessManagement(session.user, booking.businessId);
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(bookingStatusSchema, payload || {});

    if (errors) {
      return fail("Please check the booking status update.", 422, errors);
    }

    const now = new Date();
    assertBookingTransition(booking, data.status, now);
    const updatedBooking = await prisma.booking.update({
      where: {
        id: booking.id
      },
      data: {
        status: data.status,
        internalNotes: data.internalNotes ?? booking.internalNotes,
        cancellationReason:
          data.status === "CANCELED"
            ? data.cancellationReason || "Canceled by business"
            : booking.cancellationReason,
        ...getStatusTimestampData(data.status, now),
        ...getOccupancyReleaseData(data.status)
      },
      select: bookingSelect
    });

    return ok({
      booking: updatedBooking,
      message: `Booking marked ${data.status.toLowerCase().replace("_", " ")}.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
