import { bookingRequestSchema } from "@/features/bookings/validation/booking-schema";
import { createBooking, getBusinessForBooking } from "@/features/bookings/server";
import { created, fail } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { businessSlug } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(bookingRequestSchema, payload || {});

    if (errors) {
      return fail("Please check the booking form.", 422, errors);
    }

    const business = await getBusinessForBooking({
      slug: businessSlug
    });
    const result = await createBooking({
      business,
      input: data,
      source: "PUBLIC"
    });

    return created({
      booking: result.booking,
      customerAccessToken: result.customerAccessToken,
      idempotentReplay: result.idempotentReplay,
      message: result.booking.status === "CONFIRMED"
        ? "Booking confirmed."
        : "Booking request created."
    });
  } catch (error) {
    return handleApiError(error);
  }
}

