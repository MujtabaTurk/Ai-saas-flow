import {
  buildAdminPagination,
  getAdminPagination,
  requireSuperAdminContext
} from "@/features/admin/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BUSINESS_STATUSES = ["ALL", "ACTIVE", "SUSPENDED", "ARCHIVED"];

export async function GET(request) {
  try {
    await requireSuperAdminContext();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status") || "ALL";
    const pagination = getAdminPagination(searchParams);

    if (!pagination) {
      return fail("Choose valid business pagination values.", 422);
    }

    if (search && search.length > 100) {
      return fail("Search must be 100 characters or fewer.", 422);
    }

    if (!BUSINESS_STATUSES.includes(status)) {
      return fail("Choose a valid business status.", 422);
    }

    const where = {
      ...(status !== "ALL" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              {
                owner: {
                  is: {
                    email: { contains: search, mode: "insensitive" }
                  }
                }
              }
            ]
          }
        : {})
    };
    const [businesses, filteredTotal, total, active, suspended, archived] =
      await Promise.all([
        prisma.business.findMany({
          where,
          orderBy: {
            createdAt: "desc"
          },
          skip: pagination.skip,
          take: pagination.pageSize,
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            status: true,
            timezone: true,
            createdAt: true,
            updatedAt: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            subscriptions: {
              orderBy: {
                createdAt: "desc"
              },
              take: 1,
              select: {
                id: true,
                planCode: true,
                status: true,
                currentPeriodEnd: true,
                trialEndsAt: true
              }
            },
            _count: {
              select: {
                services: true,
                bookings: true,
                customers: true
              }
            }
          }
        }),
        prisma.business.count({ where }),
        prisma.business.count(),
        prisma.business.count({ where: { status: "ACTIVE" } }),
        prisma.business.count({ where: { status: "SUSPENDED" } }),
        prisma.business.count({ where: { status: "ARCHIVED" } })
      ]);

    return ok({
      businesses: businesses.map((business) => ({
        ...business,
        subscription: business.subscriptions[0] || null,
        subscriptions: undefined
      })),
      summary: {
        total,
        active,
        suspended,
        archived
      },
      pagination: buildAdminPagination({
        ...pagination,
        totalItems: filteredTotal
      })
    });
  } catch (error) {
    return handleApiError(error);
  }
}
