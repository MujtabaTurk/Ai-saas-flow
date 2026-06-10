import { availabilityStatusSchema } from "@/features/availability/validation/availability-schema";
import {
  assertNoAvailabilityOverlap,
  assertAvailabilityWriteAccess,
  availabilitySelect,
  normalizeAvailabilityInput,
  requireAvailabilityContext
} from "@/features/availability/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { business, user } = await requireAvailabilityContext();
    assertAvailabilityWriteAccess(user, business);
    const { availabilityId } = await params;
    const currentAvailability = await prisma.availability.findFirst({
      where: {
        id: availabilityId,
        businessId: business.id
      },
      select: availabilitySelect
    });

    if (!currentAvailability) {
      return fail("Working-hours range not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(availabilityStatusSchema, payload || {});

    if (errors) {
      return fail("Please check the availability status.", 422, errors);
    }

    if (data.isActive && !currentAvailability.isActive) {
      await assertNoAvailabilityOverlap({
        businessId: business.id,
        availabilityId,
        input: normalizeAvailabilityInput(currentAvailability)
      });
    }

    const availability = await prisma.availability.update({
      where: {
        id: availabilityId
      },
      data: {
        isActive: data.isActive
      },
      select: availabilitySelect
    });

    return ok({
      availability,
      message: data.isActive ? "Working-hours range activated." : "Working-hours range deactivated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
