import { formatDateTimeInTimezone } from "@/features/availability/time";
import { getBusinessForBooking } from "@/features/bookings/server";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.activeBusinessId) {
      return fail("Business access is required.", 401);
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const dateValue = searchParams.get("date");

    if (!serviceId) {
      return fail("Service is required.", 422, {
        serviceId: "Choose a service."
      });
    }

    if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return fail("A valid date is required.", 422, {
        date: "Choose a valid date."
      });
    }

    const business = await getBusinessForBooking({
      id: session.user.activeBusinessId
    });
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
      generatedAt: new Date().toISOString(),
      localToday: formatDateTimeInTimezone(new Date(), business.timezone).date,
      slots
    });
  } catch (error) {
    return handleApiError(error);
  }
}

