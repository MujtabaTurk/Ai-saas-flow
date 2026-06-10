import { assertBusinessManagement } from "@/features/auth/permissions";
import { buildBookingSummary } from "@/features/bookings/booking-summary";
import { BOOKING_STATUSES } from "@/features/bookings/constants";
import { bookingRequestSchema } from "@/features/bookings/validation/booking-schema";
import { bookingSelect, createBooking, getBusinessForBooking } from "@/features/bookings/server";
import { created, fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const BOOKING_LIST_LIMIT = 200;
const STATUS_VALUES = Object.values(BOOKING_STATUSES);

export async function GET(request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.activeBusinessId) {
      return fail("Business access is required.", 401);
    }

    const business = await getBusinessForBooking({
      id: session.user.activeBusinessId
    });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    if (status && status !== "ALL" && !STATUS_VALUES.includes(status)) {
      return fail("Choose a valid booking status.", 422, {
        status: "Choose a valid booking status."
      });
    }

    const bookingWhere = {
      businessId: business.id,
      ...(status && status !== "ALL" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { bookingNumber: { contains: search, mode: "insensitive" } },
              { customerName: { contains: search, mode: "insensitive" } },
              { customerEmail: { contains: search, mode: "insensitive" } },
              { serviceNameSnapshot: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      orderBy: {
        startsAt: "desc"
      },
      take: BOOKING_LIST_LIMIT,
      select: bookingSelect
    });

    return ok({
      bookings,
      summary: await buildBookingSummary({
        business,
        filteredWhere: bookingWhere
      }),
      limit: BOOKING_LIST_LIMIT
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.activeBusinessId) {
      return fail("Business access is required.", 401);
    }

    assertBusinessManagement(session.user, session.user.activeBusinessId);
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(bookingRequestSchema, payload || {});

    if (errors) {
      return fail("Please check the booking form.", 422, errors);
    }

    const business = await getBusinessForBooking({
      id: session.user.activeBusinessId
    });
    const result = await createBooking({
      business,
      input: data,
      source: "DASHBOARD",
      createdByUserId: session.user.id
    });

    return created({
      booking: result.booking,
      message: "Booking created."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
