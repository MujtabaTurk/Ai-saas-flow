import { getBusinessForBooking } from "@/features/bookings/server";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { businessSlug } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const dateValue = searchParams.get("date");

    if (!serviceId || !dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return fail("Service and a valid date are required.", 422);
    }

    const business = await getBusinessForBooking({
      slug: businessSlug
    });

    if (business.status !== "ACTIVE") {
      return ok({
        date: dateValue,
        timezone: business.timezone,
        slots: []
      });
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId: business.id,
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

