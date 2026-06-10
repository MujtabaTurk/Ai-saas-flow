import {
  buildUnavailableDateSummary,
  unavailableDateOrder
} from "@/features/availability/availability-response";
import { createUnavailablePeriod } from "@/features/availability/unavailable-period";
import { unavailableDateSchema } from "@/features/availability/validation/availability-schema";
import {
  assertNoUnavailableDateOverlap,
  assertAvailabilityWriteAccess,
  assertServiceBelongsToBusiness,
  requireAvailabilityContext,
  unavailableDateSelect
} from "@/features/availability/server";
import { created, fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { business } = await requireAvailabilityContext();
    const unavailableDates = await prisma.unavailableDate.findMany({
      where: {
        businessId: business.id
      },
      orderBy: unavailableDateOrder,
      select: unavailableDateSelect
    });

    return ok({
      unavailableDates,
      summary: buildUnavailableDateSummary({ unavailableDates }),
      timezone: business.timezone
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const { business, user } = await requireAvailabilityContext();
    assertAvailabilityWriteAccess(user, business);
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(unavailableDateSchema, payload || {});

    if (errors) {
      return fail("Please check the unavailable-date form.", 422, errors);
    }

    const input = createUnavailablePeriod(data, business.timezone);
    await assertServiceBelongsToBusiness(input.serviceId, business.id);
    await assertNoUnavailableDateOverlap({
      businessId: business.id,
      serviceId: input.serviceId,
      startsAt: input.startsAt,
      endsAt: input.endsAt
    });

    const unavailableDate = await prisma.unavailableDate.create({
      data: {
        ...input,
        businessId: business.id
      },
      select: unavailableDateSelect
    });

    return created({
      unavailableDate,
      message: "Unavailable date created."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
