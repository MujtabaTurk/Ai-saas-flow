import {
  assertBookingTransition,
  getStatusTimestampData,
  shouldReleaseOccupancy
} from "@/features/bookings/lifecycle";
import {
  assertBookingOperationalAccess,
  bookingSelect,
  findTenantBooking,
  getRequestedBusinessId,
  requireBookingContext
} from "@/features/bookings/server";
import { notifyBookingStatusChanged } from "@/features/notifications/events";
import { settleWalletForCompletedBooking } from "@/features/wallet/settlement";
import { notifyCreditsSettled } from "@/features/notifications/events";
import { bookingStatusSchema } from "@/features/bookings/validation/booking-schema";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
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
      bookingId
    });

    if (!booking) {
      return fail("Booking not found.", 404);
    }
    assertBookingOperationalAccess(user, booking);

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(bookingStatusSchema, payload || {});

    if (errors) {
      return fail("Please check the booking status update.", 422, errors);
    }

    const now = new Date();
    assertBookingTransition(booking, data.status, now);
    const completionResult = await prisma.$transaction(async (transaction) => {
      const result = await transaction.booking.updateMany({
        where: {
          id: booking.id,
          businessId: business.id,
          status: booking.status
        },
        data: {
          status: data.status,
          internalNotes: data.internalNotes ?? booking.internalNotes,
          cancellationReason:
            data.status === "CANCELED"
              ? data.cancellationReason || "Canceled by business"
              : booking.cancellationReason,
          ...getStatusTimestampData(data.status, now)
        }
      });

      if (result.count === 0) {
        throw new AppError(
          "This booking changed while you were updating it. Refresh and try again.",
          409
        );
      }

      if (shouldReleaseOccupancy(data.status)) {
        await transaction.bookingOccupancy.deleteMany({
          where: {
            bookingId: booking.id,
            businessId: business.id
          }
        });
      }

      let settlement = null;
      if (data.status === "COMPLETED") {
        console.info(JSON.stringify({
          event: "BOOKING_COMPLETED",
          businessId: business.id,
          bookingId: booking.id
        }));
        settlement = await settleWalletForCompletedBooking({
          transaction,
          booking: { ...booking, status: data.status }
        });
      }

      return {
        booking: await transaction.booking.findFirst({
        where: {
          id: booking.id,
          businessId: business.id
        },
        select: bookingSelect
        }),
        settlement
      };
    });
    const updatedBooking = completionResult.booking;

    if (completionResult.settlement?.settled) {
      try {
        await notifyCreditsSettled({
          booking: updatedBooking,
          amount: completionResult.settlement.amount
        });
      } catch (notificationError) {
        console.error("Could not queue credits-settled notification.", notificationError);
      }
    }

    try {
      await notifyBookingStatusChanged({
        booking: updatedBooking
      });
    } catch (notificationError) {
      console.error(
        "Could not queue booking-status notifications.",
        notificationError
      );
    }

    return ok({
      booking: updatedBooking,
      message: `Booking marked ${data.status.toLowerCase().replace("_", " ")}.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
