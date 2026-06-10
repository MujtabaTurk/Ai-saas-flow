import { assertBusinessWriteAccess } from "@/features/auth/permissions";
import { isSubscriptionEntitled } from "@/features/billing/status";
import {
  canActivateServiceForPlan,
  getServiceLimit
} from "@/features/services/policy";
import { serviceStatusSchema } from "@/features/services/validation/service-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return fail("Authentication is required.", 401);
    }

    const { serviceId } = await params;
    const currentService = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        businessId: true,
        isActive: true,
        business: {
          select: {
            id: true,
            status: true,
            subscriptions: {
              orderBy: {
                createdAt: "desc"
              },
              take: 1,
              select: {
                planCode: true,
                status: true,
                currentPeriodStart: true,
                currentPeriodEnd: true,
                trialEndsAt: true
              }
            }
          }
        }
      }
    });

    if (!currentService) {
      return fail("Service not found.", 404);
    }

    assertBusinessWriteAccess(session.user, currentService.business);

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(serviceStatusSchema, payload || {});

    if (errors) {
      return fail("Please check the service status.", 422, errors);
    }

    if (data.isActive && !currentService.isActive) {
      const activeSubscription = currentService.business.subscriptions[0];

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

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        isActive: data.isActive
      },
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
