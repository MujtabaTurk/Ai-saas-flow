import { availabilitySchema } from "@/features/availability/validation/availability-schema";
import {
  assertNoAvailabilityOverlap,
  assertAvailabilityWriteAccess,
  assertServiceBelongsToBusiness,
  availabilitySelect,
  normalizeAvailabilityInput,
  requireAvailabilityContext
} from "@/features/availability/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getAvailability(availabilityId, businessId) {
  return prisma.availability.findFirst({
    where: {
      id: availabilityId,
      businessId
    },
    select: availabilitySelect
  });
}

export async function PATCH(request, { params }) {
  try {
    const { business, user } = await requireAvailabilityContext();
    assertAvailabilityWriteAccess(user, business);
    const { availabilityId } = await params;
    const currentAvailability = await getAvailability(availabilityId, business.id);

    if (!currentAvailability) {
      return fail("Working-hours range not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(availabilitySchema, payload || {});

    if (errors) {
      return fail("Please check the working-hours form.", 422, errors);
    }

    const input = normalizeAvailabilityInput(data);
    await assertServiceBelongsToBusiness(input.serviceId, business.id);
    await assertNoAvailabilityOverlap({
      businessId: business.id,
      availabilityId,
      input,
      isActive: currentAvailability.isActive
    });

    const availability = await prisma.availability.update({
      where: {
        id: availabilityId
      },
      data: input,
      select: availabilitySelect
    });

    return ok({
      availability,
      message: "Working-hours range updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { business, user } = await requireAvailabilityContext();
    assertAvailabilityWriteAccess(user, business);
    const { availabilityId } = await params;
    const currentAvailability = await getAvailability(availabilityId, business.id);

    if (!currentAvailability) {
      return fail("Working-hours range not found.", 404);
    }

    await prisma.availability.delete({
      where: {
        id: availabilityId
      }
    });

    return ok({
      availabilityId,
      message: "Working-hours range deleted."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
