import {
  assertBusinessWriteAccess
} from "@/features/auth/permissions";
import { buildBookingConfigurationAccess } from "@/features/bookings/access";
import { DEFAULT_BOOKING_SETTINGS } from "@/features/bookings/constants";
import {
  getRequestedBusinessId,
  requireBookingContext
} from "@/features/bookings/server";
import { bookingSettingsSchema } from "@/features/bookings/validation/booking-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { business, user } = await requireBookingContext(
      getRequestedBusinessId(request)
    );

    const settings = await prisma.businessSettings.findUnique({
      where: {
        businessId: business.id
      }
    });

    return ok({
      settings: settings || DEFAULT_BOOKING_SETTINGS,
      access: buildBookingConfigurationAccess(business, user)
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request) {
  try {
    const { business, user } = await requireBookingContext(
      getRequestedBusinessId(request)
    );
    assertBusinessWriteAccess(user, business);
    const access = buildBookingConfigurationAccess(business, user);

    if (!access.canConfigure) {
      return fail(
        "An active subscription is required before updating booking settings.",
        402
      );
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(bookingSettingsSchema, payload || {});

    if (errors) {
      return fail("Please check the booking settings.", 422, errors);
    }

    const settings = await prisma.businessSettings.upsert({
      where: {
        businessId: business.id
      },
      create: {
        businessId: business.id,
        ...data
      },
      update: data
    });

    return ok({
      settings,
      access,
      message: "Booking settings updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
