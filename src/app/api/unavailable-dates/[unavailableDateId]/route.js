import { createUnavailablePeriod } from "@/features/availability/unavailable-period";
import { unavailableDateSchema } from "@/features/availability/validation/availability-schema";
import {
  assertAvailabilityEntitlement,
  assertNoUnavailableDateOverlap,
  assertAvailabilityWriteAccess,
  assertServiceBelongsToBusiness,
  findTenantUnavailableDate,
  getRequestedBusinessId,
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
    const { unavailableDateId } = await params;
    const currentUnavailableDate = await findTenantUnavailableDate({
      businessId: business.id,
      unavailableDateId
    });

    if (!currentUnavailableDate) {
      return fail("Unavailable date not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(unavailableDateSchema, payload || {});

    if (errors) {
      return fail("Please check the unavailable-date form.", 422, errors);
    }

    const input = createUnavailablePeriod(data, business.timezone);
    await assertServiceBelongsToBusiness(input.serviceId, business.id);
    await assertNoUnavailableDateOverlap({
      businessId: business.id,
      unavailableDateId,
      serviceId: input.serviceId,
      startsAt: input.startsAt,
      endsAt: input.endsAt
    });

    const result = await prisma.unavailableDate.updateMany({
      where: {
        id: unavailableDateId,
        businessId: business.id
      },
      data: input
    });

    if (result.count === 0) {
      return fail("Unavailable date not found.", 404);
    }

    const unavailableDate = await findTenantUnavailableDate({
      businessId: business.id,
      unavailableDateId
    });

    return ok({
      unavailableDate,
      message: "Unavailable date updated."
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
    const { unavailableDateId } = await params;
    const currentUnavailableDate = await findTenantUnavailableDate({
      businessId: business.id,
      unavailableDateId,
      select: {
        id: true
      }
    });

    if (!currentUnavailableDate) {
      return fail("Unavailable date not found.", 404);
    }

    const result = await prisma.unavailableDate.deleteMany({
      where: {
        id: unavailableDateId,
        businessId: business.id
      }
    });

    if (result.count === 0) {
      return fail("Unavailable date not found.", 404);
    }

    return ok({
      unavailableDateId,
      message: "Unavailable date deleted."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
