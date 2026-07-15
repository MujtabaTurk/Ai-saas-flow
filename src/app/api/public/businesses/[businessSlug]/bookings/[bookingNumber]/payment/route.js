import { chooseBookingPaymentMethod, createBookingCheckoutSession, getPublicBookingPaymentContext } from "@/features/bookings/payment";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { businessSlug, bookingNumber } = await params;
    const token = new URL(request.url).searchParams.get("token");
    const context = await getPublicBookingPaymentContext({ businessSlug, bookingNumber, token });
    return ok({ business: context.business, booking: context.booking });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request, { params }) {
  try {
    const { businessSlug, bookingNumber } = await params;
    const body = await request.json().catch(() => ({}));
    const token = body.token;
    if (body.action === "checkout") return ok(await createBookingCheckoutSession({ businessSlug, bookingNumber, token, request }));
    if (body.action === "manual") return ok(await chooseBookingPaymentMethod({ businessSlug, bookingNumber, token, method: body.method }));
    return fail("Choose a payment action.", 422);
  } catch (error) { return handleApiError(error); }
}
