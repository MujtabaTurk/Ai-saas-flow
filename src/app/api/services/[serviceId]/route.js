import {
  assertBusinessManagement,
  assertBusinessWriteAccess
} from "@/features/auth/permissions";
import { normalizeServiceInput } from "@/features/services/service-normalizer";
import { serviceSelect } from "@/features/services/service-response";
import { serviceFormSchema } from "@/features/services/validation/service-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getOwnedService(serviceId, user, requireWriteAccess = false) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      ...serviceSelect,
      business: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!service) {
    return null;
  }

  assertBusinessManagement(user, service.businessId);

  if (requireWriteAccess) {
    assertBusinessWriteAccess(user, service.business);
  }

  const { business: _business, ...ownedService } = service;
  return ownedService;
}

export async function GET(_request, { params }) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return fail("Authentication is required.", 401);
    }

    const { serviceId } = await params;
    const service = await getOwnedService(serviceId, session.user);

    if (!service) {
      return fail("Service not found.", 404);
    }

    return ok({ service });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return fail("Authentication is required.", 401);
    }

    const { serviceId } = await params;
    const currentService = await getOwnedService(serviceId, session.user, true);

    if (!currentService) {
      return fail("Service not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(serviceFormSchema, payload || {});

    if (errors) {
      return fail("Please check the service form.", 422, errors);
    }

    const normalized = normalizeServiceInput(data);
    const existingSlug = await prisma.service.findFirst({
      where: {
        businessId: currentService.businessId,
        slug: normalized.slug,
        id: {
          not: serviceId
        }
      },
      select: {
        id: true
      }
    });

    if (existingSlug) {
      return fail("A service with this slug already exists.", 409, {
        slug: "A service with this slug already exists."
      });
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: normalized,
      select: serviceSelect
    });

    return ok({
      service,
      message: "Service updated successfully."
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return fail("Authentication is required.", 401);
    }

    const { serviceId } = await params;
    const currentService = await getOwnedService(serviceId, session.user, true);

    if (!currentService) {
      return fail("Service not found.", 404);
    }

    const [bookingCount, availabilityCount, unavailableDateCount] = await Promise.all([
      prisma.booking.count({
        where: {
          serviceId
        }
      }),
      prisma.availability.count({
        where: {
          serviceId
        }
      }),
      prisma.unavailableDate.count({
        where: {
          serviceId
        }
      })
    ]);

    if (bookingCount > 0) {
      return fail("This service has bookings and cannot be deleted. Deactivate it instead.", 409);
    }

    if (availabilityCount > 0 || unavailableDateCount > 0) {
      return fail(
        "This service has service-specific scheduling records. Remove those records or deactivate the service instead.",
        409
      );
    }

    await prisma.service.delete({
      where: { id: serviceId }
    });

    return ok({
      serviceId,
      message: "Service deleted successfully."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
