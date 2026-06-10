import {
  assertBusinessManagement,
  assertBusinessWriteAccess
} from "@/features/auth/permissions";
import { DEFAULT_BOOKING_SETTINGS } from "@/features/bookings/constants";
import { bookingSettingsSchema } from "@/features/bookings/validation/booking-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.activeBusinessId) {
      return fail("Business access is required.", 401);
    }

    const settings = await prisma.businessSettings.findUnique({
      where: {
        businessId: session.user.activeBusinessId
      }
    });

    return ok({
      settings: settings || DEFAULT_BOOKING_SETTINGS
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.activeBusinessId) {
      return fail("Business access is required.", 401);
    }

    assertBusinessManagement(session.user, session.user.activeBusinessId);
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(bookingSettingsSchema, payload || {});

    if (errors) {
      return fail("Please check the booking settings.", 422, errors);
    }

    const business = await prisma.business.findUnique({
      where: {
        id: session.user.activeBusinessId
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!business) {
      return fail("Business not found.", 404);
    }

    assertBusinessWriteAccess(session.user, business);

    const settings = await prisma.businessSettings.upsert({
      where: {
        businessId: session.user.activeBusinessId
      },
      create: {
        businessId: session.user.activeBusinessId,
        ...data
      },
      update: data
    });

    return ok({
      settings,
      message: "Booking settings updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
