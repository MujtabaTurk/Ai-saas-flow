import { availabilitySchema } from "@/features/availability/validation/availability-schema";
import {
  availabilityOrder,
  buildAvailabilityAccess,
  buildAvailabilitySummary
} from "@/features/availability/availability-response";
import {
  assertAvailabilityEntitlement,
  assertNoAvailabilityOverlap,
  assertAvailabilityWriteAccess,
  assertServiceBelongsToBusiness,
  availabilitySelect,
  getRequestedBusinessId,
  normalizeAvailabilityInput,
  requireAvailabilityContext
} from "@/features/availability/server";
import { created, fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { business, user } = await requireAvailabilityContext(
      getRequestedBusinessId(request)
    );
    const availability = await prisma.availability.findMany({
      where: {
        businessId: business.id
      },
      orderBy: availabilityOrder,
      select: availabilitySelect
    });

    return ok({
      availability,
      summary: buildAvailabilitySummary({
        availability,
        timezone: business.timezone
      }),
      access: buildAvailabilityAccess(business, user),
      timezone: business.timezone
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const { business, user } = await requireAvailabilityContext(
      getRequestedBusinessId(request)
    );
    assertAvailabilityWriteAccess(user, business);
    assertAvailabilityEntitlement(user, business);
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(availabilitySchema, payload || {});

    if (errors) {
      return fail("Please check the working-hours form.", 422, errors);
    }

    const input = normalizeAvailabilityInput(data);
    await assertServiceBelongsToBusiness(input.serviceId, business.id);
    await assertNoAvailabilityOverlap({
      businessId: business.id,
      input
    });

    const availability = await prisma.availability.create({
      data: {
        ...input,
        businessId: business.id
      },
      select: availabilitySelect
    });

    return created({
      availability,
      message: "Working-hours range created."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
