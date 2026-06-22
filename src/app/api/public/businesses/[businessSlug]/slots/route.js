import { getBusinessForBooking } from "@/features/bookings/server";
import { getBookingCreationAccess } from "@/features/bookings/access";
import { getBookingSettings } from "@/features/bookings/lifecycle";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import { isValidDateValue } from "@/features/availability/time";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { businessSlug } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const dateValue = searchParams.get("date");

    if (!isValidMongoObjectId(serviceId) || !isValidDateValue(dateValue)) {
      return fail("Service and a valid date are required.", 422);
    }

    const business = await getBusinessForBooking({
      slug: businessSlug
    });
    const access = await getBookingCreationAccess({ business });
    const settings = getBookingSettings(business.settings);

    if (!access.canCreate || !settings.allowGuestBookings) {
      return ok({
        date: dateValue,
        timezone: business.timezone,
        acceptingBookings: false,
        blockedReason: access.createBlockedReason || "GUEST_BOOKING_DISABLED",
        slots: []
      });
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId: business.id,
        type: "BOOKING",
        isActive: true
      },
      select: {
        id: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        isActive: true
      }
    });

    if (!service) {
      return fail("Active service not found.", 404);
    }

    const slots = await getAvailableSlotsForBusiness({
      business,
      service,
      dateValue
    });

    return ok({
      date: dateValue,
      timezone: business.timezone,
      acceptingBookings: true,
      blockedReason: null,
      slots: slots.map(({ startsAt, endsAt, timezone }) => ({
        startsAt,
        endsAt,
        timezone
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
