import { isSubscriptionEntitled } from "@/features/billing/status";
import {
  canActivateServiceForPlan,
  getServiceLimit
} from "@/features/services/policy";
import {
  assertServiceWriteAccess,
  findTenantService,
  getRequestedBusinessId,
  requireServiceBusiness
} from "@/features/services/server";
import { serviceStatusSchema } from "@/features/services/validation/service-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
      select: {
        id: true,
        businessId: true,
        isActive: true
      }
    });

    if (!currentService) {
      return fail("Service not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(serviceStatusSchema, payload || {});

    if (errors) {
      return fail("Please check the service status.", 422, errors);
    }

    if (data.isActive && !currentService.isActive) {
      const activeSubscription = business.subscriptions[0];

      if (!isSubscriptionEntitled(activeSubscription)) {
        return fail("An active subscription is required before activating services.", 402);
      }

      const activeServiceCount = await prisma.service.count({
        where: {
          businessId: currentService.businessId,
          isActive: true
        }
      });

      if (!canActivateServiceForPlan(activeSubscription.planCode, activeServiceCount)) {
        return fail("Your current plan has reached its active service limit.", 403, {
          services: `Active service limit reached for ${activeSubscription.planCode}.`,
          limit: getServiceLimit(activeSubscription.planCode)
        });
      }
    }

    const result = await prisma.service.updateMany({
      where: {
        id: serviceId,
        businessId: business.id
      },
      data: {
        isActive: data.isActive
      }
    });

    if (result.count === 0) {
      return fail("Service not found.", 404);
    }

    const service = await findTenantService({
      businessId: business.id,
      serviceId,
      select: {
        id: true,
        businessId: true,
        name: true,
        isActive: true,
        updatedAt: true
      }
    });

    return ok({
      service,
      message: data.isActive ? "Service activated." : "Service deactivated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
