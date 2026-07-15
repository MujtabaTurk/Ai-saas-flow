import {
  buildAdminPagination,
  getAdminPagination,
  requireSuperAdminContext
} from "@/features/admin/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SUBSCRIPTION_STATUSES = [
  "ALL",
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
  "UNPAID",
  "PAUSED"
];

export async function GET(request) {
  try {
    await requireSuperAdminContext();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const planCode = searchParams.get("planCode") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const pagination = getAdminPagination(searchParams);

    if (!pagination) {
      return fail("Choose valid subscription pagination values.", 422);
    }

    if (search && search.length > 100) {
      return fail("Search must be 100 characters or fewer.", 422);
    }

    if (planCode !== "ALL" && !/^[A-Z0-9_-]+$/.test(planCode)) {
      return fail("Choose a valid subscription plan.", 422);
    }

    if (!SUBSCRIPTION_STATUSES.includes(status)) {
      return fail("Choose a valid subscription status.", 422);
    }

    let matchingBusinessIds = null;

    if (search) {
      const matchingBusinesses = await prisma.business.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            {
              owner: {
                is: {
                  email: { contains: search, mode: "insensitive" }
                }
              }
            }
          ]
        },
        select: {
          id: true
        }
      });
      matchingBusinessIds = matchingBusinesses.map((business) => business.id);
    }

    const where = {
      ...(planCode !== "ALL"
        ? { OR: [{ planCode }, { platformPlan: { is: { code: planCode } } }] }
        : {}),
      ...(status !== "ALL" ? { status } : {}),
      ...(matchingBusinessIds ? { businessId: { in: matchingBusinessIds } } : {})
    };
    const [
      subscriptions,
      filteredTotal,
      total,
      active,
      trialing,
      pastDue,
      canceled
    ] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: {
          updatedAt: "desc"
        },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: {
          id: true,
          planCode: true,
          status: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          trialEndsAt: true,
          cancelAtPeriodEnd: true,
          canceledAt: true,
          lastPaymentAt: true,
          lastPaymentFailedAt: true,
          createdAt: true,
          updatedAt: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              owner: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.subscription.count({ where }),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "TRIALING" } }),
      prisma.subscription.count({ where: { status: "PAST_DUE" } }),
      prisma.subscription.count({ where: { status: "CANCELED" } })
    ]);

    return ok({
      subscriptions,
      summary: {
        total,
        active,
        trialing,
        pastDue,
        canceled
      },
      sourceOfTruth: "STRIPE_WEBHOOKS",
      pagination: buildAdminPagination({
        ...pagination,
        totalItems: filteredTotal
      })
    });
  } catch (error) {
    return handleApiError(error);
  }
}
