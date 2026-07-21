import { rescheduleCustomerBooking } from "@/features/bookings/customer-actions";
import { notifyBookingRescheduled } from "@/features/notifications/events";
import { bookingRequestSchema } from "@/features/bookings/validation/booking-schema";
import {
  customerPortalBookingSelect,
  getCustomerBookingContext
} from "@/features/customer-portal/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

const customerRescheduleSchema = bookingRequestSchema.pick(["startsAt"]);

export async function PATCH(request, { params }) {
  try {
    const { bookingId } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerRescheduleSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the reschedule request.", 422, errors);
    }

    const { booking, business } = await getCustomerBookingContext({
      bookingId
    });
    const updatedBooking = await rescheduleCustomerBooking({
      booking,
      business,
      startsAt: data.startsAt,
      select: customerPortalBookingSelect
    });
    try {
      await notifyBookingRescheduled({ booking: updatedBooking });
    } catch (notificationError) {
      console.error("Could not queue booking-rescheduled notifications.", notificationError);
    }

    return ok({
      booking: updatedBooking,
      message: "Booking rescheduled."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
