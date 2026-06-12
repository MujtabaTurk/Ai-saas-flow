import { availabilityStatusSchema } from "@/features/availability/validation/availability-schema";
import {
  assertAvailabilityEntitlement,
  assertNoAvailabilityOverlap,
  assertAvailabilityWriteAccess,
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
    const { availabilityId } = await params;
    const currentAvailability = await findTenantAvailability({
      businessId: business.id,
      availabilityId
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
      assertAvailabilityEntitlement(user, business);
      await assertNoAvailabilityOverlap({
        businessId: business.id,
        availabilityId,
        input: normalizeAvailabilityInput(currentAvailability)
      });
    }

    const result = await prisma.availability.updateMany({
      where: {
        id: availabilityId,
        businessId: business.id
      },
      data: {
        isActive: data.isActive
      }
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
      message: data.isActive ? "Working-hours range activated." : "Working-hours range deactivated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
