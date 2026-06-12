import { normalizeServiceInput } from "@/features/services/service-normalizer";
import { serviceSelect } from "@/features/services/service-response";
import {
  assertServiceWriteAccess,
  findTenantService,
  getRequestedBusinessId,
  requireServiceBusiness
} from "@/features/services/server";
import { serviceApiSchema } from "@/features/services/validation/service-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const user = await requireCurrentUser();
    const business = await requireServiceBusiness(
      user,
      getRequestedBusinessId(request)
    );
    const { serviceId } = await params;
    const service = await findTenantService({
      businessId: business.id,
      serviceId,
      select: serviceSelect
    });

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
    const user = await requireCurrentUser();
    const business = await requireServiceBusiness(
      user,
      getRequestedBusinessId(request)
    );
    assertServiceWriteAccess(user, business);
    const { serviceId } = await params;
    const currentService = await findTenantService({
      businessId: business.id,
      serviceId,
      select: serviceSelect
    });

    if (!currentService) {
      return fail("Service not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(serviceApiSchema, payload || {});

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

    const result = await prisma.service.updateMany({
      where: {
        id: serviceId,
        businessId: business.id
      },
      data: normalized
    });

    if (result.count === 0) {
      return fail("Service not found.", 404);
    }

    const service = await findTenantService({
      businessId: business.id,
      serviceId,
      select: serviceSelect
    });

    return ok({
      service,
      message: "Service updated successfully."
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return fail("A service with this slug already exists.", 409, {
        slug: "A service with this slug already exists."
      });
    }

    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireCurrentUser();
    const business = await requireServiceBusiness(
      user,
      getRequestedBusinessId(request)
    );
    assertServiceWriteAccess(user, business);
    const { serviceId } = await params;
    const currentService = await findTenantService({
      businessId: business.id,
      serviceId,
      select: {
        id: true
      }
    });

    if (!currentService) {
      return fail("Service not found.", 404);
    }

    const [bookingCount, availabilityCount, unavailableDateCount] = await Promise.all([
      prisma.booking.count({
        where: {
          serviceId,
          businessId: business.id
        }
      }),
      prisma.availability.count({
        where: {
          serviceId,
          businessId: business.id
        }
      }),
      prisma.unavailableDate.count({
        where: {
          serviceId,
          businessId: business.id
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

    const result = await prisma.service.deleteMany({
      where: {
        id: serviceId,
        businessId: business.id
      }
    });

    if (result.count === 0) {
      return fail("Service not found.", 404);
    }

    return ok({
      serviceId,
      message: "Service deleted successfully."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
