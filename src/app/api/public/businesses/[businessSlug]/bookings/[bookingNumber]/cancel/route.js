import { verifyCustomerAccessToken } from "@/features/bookings/access-token";
import {
  canCustomerCancelBooking,
  getBookingSettings
} from "@/features/bookings/lifecycle";
import { bookingSelect, getBusinessForBooking } from "@/features/bookings/server";
import { customerCancellationSchema } from "@/features/bookings/validation/booking-schema";
import { notifyCustomerCanceledBooking } from "@/features/notifications/events";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
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

    const now = new Date();
    const latestCancelableStart = new Date(
      now.getTime() + settings.cancellationWindowMin * 60 * 1000
    );
    const updatedBooking = await prisma.$transaction(async (transaction) => {
      const result = await transaction.booking.updateMany({
        where: {
          id: booking.id,
          businessId: business.id,
          status: booking.status,
          startsAt: {
            gt: latestCancelableStart
          }
        },
        data: {
          status: "CANCELED",
          canceledAt: now,
          cancellationReason: data.reason || "Canceled by customer"
        }
      });

      if (result.count === 0) {
        throw new AppError(
          "This booking changed while it was being canceled. Refresh and try again.",
          409
        );
      }

      await transaction.bookingOccupancy.deleteMany({
        where: {
          bookingId: booking.id,
          businessId: business.id
        }
      });

      return transaction.booking.findFirst({
        where: {
          id: booking.id,
          businessId: business.id
        },
        select: bookingSelect
      });
    });

    try {
      await notifyCustomerCanceledBooking({
        booking: updatedBooking
      });
    } catch (notificationError) {
      console.error(
        "Could not queue booking-cancellation notifications.",
        notificationError
      );
    }

    return ok({
      booking: updatedBooking,
      message: "Booking canceled."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
