import { verifyCustomerAccessToken } from "@/features/bookings/access-token";
import {
  canCustomerCancelBooking,
  getOccupancyReleaseData,
  getBookingSettings
} from "@/features/bookings/lifecycle";
import { bookingSelect, getBusinessForBooking } from "@/features/bookings/server";
import { customerCancellationSchema } from "@/features/bookings/validation/booking-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { businessSlug, bookingNumber } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(customerCancellationSchema, payload || {});

    if (errors) {
      return fail("Please check the cancellation request.", 422, errors);
    }

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

    if (!booking || !verifyCustomerAccessToken(data.token, booking.customerAccessTokenHash)) {
      return fail("Booking not found or access token is invalid.", 404);
    }

    const settings = getBookingSettings(business.settings);

    if (!canCustomerCancelBooking(booking, settings)) {
      return fail("The cancellation deadline has passed or this booking cannot be canceled.", 409);
    }

    const updatedBooking = await prisma.booking.update({
      where: {
        id: booking.id
      },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        cancellationReason: data.reason || "Canceled by customer",
        ...getOccupancyReleaseData("CANCELED")
      },
      select: bookingSelect
    });

    return ok({
      booking: updatedBooking,
      message: "Booking canceled."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
