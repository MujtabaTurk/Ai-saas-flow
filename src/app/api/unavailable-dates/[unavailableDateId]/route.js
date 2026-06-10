import { createUnavailablePeriod } from "@/features/availability/unavailable-period";
import { unavailableDateSchema } from "@/features/availability/validation/availability-schema";
import {
  assertNoUnavailableDateOverlap,
  assertAvailabilityWriteAccess,
  assertServiceBelongsToBusiness,
  requireAvailabilityContext,
  unavailableDateSelect
} from "@/features/availability/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getUnavailableDate(unavailableDateId, businessId) {
  return prisma.unavailableDate.findFirst({
    where: {
      id: unavailableDateId,
      businessId
    },
    select: unavailableDateSelect
  });
}

export async function PATCH(request, { params }) {
  try {
    const { business, user } = await requireAvailabilityContext();
    assertAvailabilityWriteAccess(user, business);
    const { unavailableDateId } = await params;
    const currentUnavailableDate = await getUnavailableDate(unavailableDateId, business.id);

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

    const unavailableDate = await prisma.unavailableDate.update({
      where: {
        id: unavailableDateId
      },
      data: input,
      select: unavailableDateSelect
    });

    return ok({
      unavailableDate,
      message: "Unavailable date updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { business, user } = await requireAvailabilityContext();
    assertAvailabilityWriteAccess(user, business);
    const { unavailableDateId } = await params;
    const currentUnavailableDate = await getUnavailableDate(unavailableDateId, business.id);

    if (!currentUnavailableDate) {
      return fail("Unavailable date not found.", 404);
    }

    await prisma.unavailableDate.delete({
      where: {
        id: unavailableDateId
      }
    });

    return ok({
      unavailableDateId,
      message: "Unavailable date deleted."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
