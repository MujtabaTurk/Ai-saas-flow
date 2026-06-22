import { isSubscriptionEntitled } from "@/features/billing/status";
import { getServiceLimit, canCreateServiceForPlan } from "@/features/services/policy";
import { normalizeServiceInput } from "@/features/services/service-normalizer";
import {
  buildServiceSummary,
  serviceListOrder,
  serviceSelect
} from "@/features/services/service-response";
import {
  assertServiceWriteAccess,
  getRequestedBusinessId,
  requireServiceBusiness
} from "@/features/services/server";
import { serviceApiSchema } from "@/features/services/validation/service-schema";
import { fail, created, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const user = await requireCurrentUser();
    const business = await requireServiceBusiness(
      user,
      getRequestedBusinessId(request)
    );

    const services = await prisma.service.findMany({
      where: { businessId: business.id, type: "BOOKING" },
      orderBy: serviceListOrder,
      select: serviceSelect
    });

    return ok({
      services,
      summary: buildServiceSummary({ business, services, user })
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireCurrentUser();
    const business = await requireServiceBusiness(
      user,
      getRequestedBusinessId(request)
    );
    assertServiceWriteAccess(user, business);

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(serviceApiSchema, payload || {});

    if (errors) {
      return fail("Please check the service form.", 422, errors);
    }

    const activeSubscription = business.subscriptions[0];

    if (!isSubscriptionEntitled(activeSubscription)) {
      return fail("An active subscription is required before creating services.", 402);
    }

    const currentServiceCount = await prisma.service.count({
      where: { businessId: business.id, type: "BOOKING" }
    });

    if (!canCreateServiceForPlan(activeSubscription.planCode, currentServiceCount)) {
      return fail("Your current plan has reached its service limit.", 403, {
        services: `Service limit reached for ${activeSubscription.planCode}.`,
        limit: getServiceLimit(activeSubscription.planCode)
      });
    }

    const normalized = normalizeServiceInput(data);
    const existingSlug = await prisma.service.findUnique({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: normalized.slug
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

    const service = await prisma.service.create({
      data: {
        ...normalized,
        businessId: business.id,
        type: "BOOKING",
        currency: normalized.currency || business.currency
      },
      select: serviceSelect
    });

    return created({
      service,
      message: "Service created successfully."
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
