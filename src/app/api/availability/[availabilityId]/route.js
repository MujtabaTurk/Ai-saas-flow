import { availabilitySchema } from "@/features/availability/validation/availability-schema";
import {
  assertAvailabilityEntitlement,
  assertNoAvailabilityOverlap,
  assertAvailabilityWriteAccess,
  assertServiceBelongsToBusiness,
  findTenantAvailability,
  getRequestedBusinessId,
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
    const { business, user } = await requireAvailabilityContext(
      getRequestedBusinessId(request)
    );
    assertAvailabilityWriteAccess(user, business);
    assertAvailabilityEntitlement(user, business);
    const { availabilityId } = await params;
    const currentAvailability = await findTenantAvailability({
      businessId: business.id,
      availabilityId
    });

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

    const result = await prisma.availability.updateMany({
      where: {
        id: availabilityId,
        businessId: business.id
      },
      data: input
    });

    if (result.count === 0) {
      return fail("Working-hours range not found.", 404);
    }

    const availability = await findTenantAvailability({
      businessId: business.id,
      availabilityId
    });

    return ok({
      availability,
      message: "Working-hours range updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { business, user } = await requireAvailabilityContext(
      getRequestedBusinessId(request)
    );
    assertAvailabilityWriteAccess(user, business);
    const { availabilityId } = await params;
    const currentAvailability = await findTenantAvailability({
      businessId: business.id,
      availabilityId,
      select: {
        id: true
      }
    });

    if (!currentAvailability) {
      return fail("Working-hours range not found.", 404);
    }

    const result = await prisma.availability.deleteMany({
      where: {
        id: availabilityId,
        businessId: business.id
      }
    });

    if (result.count === 0) {
      return fail("Working-hours range not found.", 404);
    }

    return ok({
      availabilityId,
      message: "Working-hours range deleted."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
