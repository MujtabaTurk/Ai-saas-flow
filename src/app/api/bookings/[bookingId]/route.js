import {
  assertBookingOperationalAccess,
  findTenantBooking,
  getRequestedBusinessId,
  requireBookingContext
} from "@/features/bookings/server";
import { bookingNotesSchema } from "@/features/bookings/validation/booking-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { business, user } = await requireBookingContext(
      getRequestedBusinessId(request)
    );
    const { bookingId } = await params;
    const booking = await findTenantBooking({
      businessId: business.id,
      bookingId,
      select: {
        id: true
      }
    });

    if (!booking) {
      return fail("Booking not found.", 404);
    }
    assertBookingOperationalAccess(user, booking);

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      bookingNotesSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the internal notes.", 422, errors);
    }

    const result = await prisma.booking.updateMany({
      where: {
        id: bookingId,
        businessId: business.id
      },
      data: {
        internalNotes: data.internalNotes?.trim() || null
      }
    });

    if (result.count === 0) {
      return fail("Booking not found.", 404);
    }

    return ok({
      booking: await findTenantBooking({
        businessId: business.id,
        bookingId
      }),
      message: "Internal notes updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
