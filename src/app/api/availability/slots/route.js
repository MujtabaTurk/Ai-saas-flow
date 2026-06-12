import {
  formatDateTimeInTimezone,
  isValidDateValue
} from "@/features/availability/time";
import {
  getRequestedBusinessId,
  requireAvailabilityContext
} from "@/features/availability/server";
import { getBookingCreationAccess } from "@/features/bookings/access";
import { getBusinessForBooking } from "@/features/bookings/server";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const {
      business: availabilityBusiness,
      user
    } = await requireAvailabilityContext(
      getRequestedBusinessId(request)
    );
    const serviceId = searchParams.get("serviceId");
    const dateValue = searchParams.get("date");

    if (!isValidMongoObjectId(serviceId)) {
      return fail("Service is required.", 422, {
        serviceId: "Choose a service."
      });
    }

    if (!isValidDateValue(dateValue)) {
      return fail("A valid date is required.", 422, {
        date: "Choose a valid date."
      });
    }

    const business = await getBusinessForBooking({
      id: availabilityBusiness.id
    });
    const access = await getBookingCreationAccess({
      business,
      user
    });

    if (!access.canCreate) {
      return ok({
        date: dateValue,
        timezone: business.timezone,
        generatedAt: new Date().toISOString(),
        localToday: formatDateTimeInTimezone(new Date(), business.timezone).date,
        access,
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
      generatedAt: new Date().toISOString(),
      localToday: formatDateTimeInTimezone(new Date(), business.timezone).date,
      access,
      slots
    });
  } catch (error) {
    return handleApiError(error);
  }
}
