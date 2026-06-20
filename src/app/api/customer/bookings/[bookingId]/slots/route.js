import { isValidDateValue } from "@/features/availability/time";
import {
  canCustomerCancelBooking,
  getBookingSettings
} from "@/features/bookings/lifecycle";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import { getCustomerBookingContext } from "@/features/customer-portal/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { bookingId } = await params;
    const dateValue = new URL(request.url).searchParams.get("date");

    if (!isValidDateValue(dateValue)) {
      return fail("Choose a valid date.", 422);
    }

    const { booking, business } = await getCustomerBookingContext({
      bookingId
    });
    const settings = getBookingSettings(business.settings);
    const canReschedule = canCustomerCancelBooking(booking, settings);

    if (!canReschedule) {
      return ok({
        date: dateValue,
        timezone: business.timezone,
        canReschedule: false,
        slots: []
      });
    }

    const service = await prisma.service.findFirst({
      where: {
        id: booking.serviceId,
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
      canReschedule: true,
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
