import { verifyCustomerAccessToken } from "@/features/bookings/access-token";
import {
  canCustomerCancelBooking,
  getCancellationDeadline,
  getBookingSettings
} from "@/features/bookings/lifecycle";
import { bookingSelect, getBusinessForBooking } from "@/features/bookings/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";
import { reconcileBookingCheckoutSession } from "@/features/bookings/payment";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { businessSlug, bookingNumber } = await params;
    const query = new URL(request.url).searchParams;
    const token = query.get("token");
    const business = await getBusinessForBooking({
      slug: businessSlug
    });
    const booking = await prisma.booking.findUnique({
      where: {
        businessId_bookingNumber: {
          businessId: business.id,
          bookingNumber
        }
      },
      select: {
        ...bookingSelect,
        customerAccessTokenHash: true
      }
    });

    if (!booking || !verifyCustomerAccessToken(token, booking.customerAccessTokenHash)) {
      return fail("Booking not found or access token is invalid.", 404);
    }

    if (query.get("session_id")) {
      await reconcileBookingCheckoutSession({ sessionId: query.get("session_id"), businessId: business.id, bookingId: booking.id });
    }

    const settings = getBookingSettings(business.settings);

    return ok({
      booking: {
        ...booking,
        customerAccessTokenHash: undefined
      },
      cancellationDeadline: getCancellationDeadline(booking, settings),
      canCancel: canCustomerCancelBooking(booking, settings)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
