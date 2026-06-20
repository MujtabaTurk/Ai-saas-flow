import { cancelCustomerBooking } from "@/features/bookings/customer-actions";
import { customerCancellationSchema } from "@/features/bookings/validation/booking-schema";
import {
  customerPortalBookingSelect,
  getCustomerBookingContext
} from "@/features/customer-portal/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

const customerPortalCancellationSchema =
  customerCancellationSchema.omit(["token"]);

export async function POST(request, { params }) {
  try {
    const { bookingId } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerPortalCancellationSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the cancellation request.", 422, errors);
    }

    const { booking, business } = await getCustomerBookingContext({
      bookingId
    });
    const updatedBooking = await cancelCustomerBooking({
      booking,
      business,
      reason: data.reason,
      select: customerPortalBookingSelect
    });

    return ok({
      booking: updatedBooking,
      message: "Booking canceled."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
