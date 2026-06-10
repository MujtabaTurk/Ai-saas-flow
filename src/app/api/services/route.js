import { assertBusinessWriteAccess } from "@/features/auth/permissions";
import { isSubscriptionEntitled } from "@/features/billing/status";
import { getServiceLimit, canCreateServiceForPlan } from "@/features/services/policy";
import { normalizeServiceInput } from "@/features/services/service-normalizer";
import {
  buildServiceSummary,
  serviceListOrder,
  serviceSelect
} from "@/features/services/service-response";
import { serviceFormSchema } from "@/features/services/validation/service-schema";
import { fail, created, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getCurrentBusiness(user) {
  if (!user?.activeBusinessId) {
    return null;
  }

  return prisma.business.findUnique({
    where: { id: user.activeBusinessId },
    select: {
      id: true,
      status: true,
      currency: true,
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
  });
}

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return fail("Authentication is required.", 401);
    }

    const business = await getCurrentBusiness(session.user);

    if (!business) {
      return fail("Business onboarding is required before managing services.", 409);
    }

    const services = await prisma.service.findMany({
      where: { businessId: business.id },
      orderBy: serviceListOrder,
      select: serviceSelect
    });

    return ok({
      services,
      summary: buildServiceSummary({ business, services })
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return fail("Authentication is required.", 401);
    }

    const business = await getCurrentBusiness(session.user);

    if (!business) {
      return fail("Business onboarding is required before creating services.", 409);
    }

    assertBusinessWriteAccess(session.user, business);

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(serviceFormSchema, payload || {});

    if (errors) {
      return fail("Please check the service form.", 422, errors);
    }

    const activeSubscription = business.subscriptions[0];

    if (!isSubscriptionEntitled(activeSubscription)) {
      return fail("An active subscription is required before creating services.", 402);
    }

    const currentServiceCount = await prisma.service.count({
      where: { businessId: business.id }
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
        currency: normalized.currency || business.currency
      },
      select: serviceSelect
    });

    return created({
      service,
      message: "Service created successfully."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
