import {
  buildAdminPagination,
  getAdminPagination,
  requireSuperAdminContext
} from "@/features/admin/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PLATFORM_ROLES = ["ALL", "USER", "ADMIN", "SUPER_ADMIN"];

export async function GET(request) {
  try {
    const { user: currentUser } = await requireSuperAdminContext();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const platformRole = searchParams.get("platformRole") || "ALL";
    const pagination = getAdminPagination(searchParams);

    if (!pagination) {
      return fail("Choose valid user pagination values.", 422);
    }

    if (search && search.length > 100) {
      return fail("Search must be 100 characters or fewer.", 422);
    }

    if (!PLATFORM_ROLES.includes(platformRole)) {
      return fail("Choose a valid platform role.", 422);
    }

    const where = {
      ...(platformRole !== "ALL" ? { platformRole } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };
    const [
      users,
      filteredTotal,
      total,
      userCount,
      adminCount,
      superAdminCount,
      activeSessions
    ] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          platformRole: true,
          createdAt: true,
          updatedAt: true,
          ownedBusinesses: {
            where: {
              status: {
                not: "ARCHIVED"
              }
            },
            orderBy: {
              createdAt: "asc"
            },
            take: 3,
            select: {
              id: true,
              name: true,
              slug: true,
              status: true
            }
          },
          _count: {
            select: {
              ownedBusinesses: true,
              customerProfiles: true,
              createdBookings: true
            }
          }
        }
      }),
      prisma.user.count({ where }),
      prisma.user.count(),
      prisma.user.count({ where: { platformRole: "USER" } }),
      prisma.user.count({ where: { platformRole: "ADMIN" } }),
      prisma.user.count({ where: { platformRole: "SUPER_ADMIN" } }),
      prisma.session.findMany({
        where: {
          expires: {
            gt: new Date()
          }
        },
        select: {
          userId: true
        }
      })
    ]);
    const activeUserIds = new Set(
      activeSessions.map((session) => session.userId)
    );

    return ok({
      users: users.map((user) => ({
        ...user,
        isCurrentUser: user.id === currentUser.id,
        hasActiveSession: activeUserIds.has(user.id)
      })),
      summary: {
        total,
        users: userCount,
        admins: adminCount,
        superAdmins: superAdminCount,
        activeUsers: activeUserIds.size
      },
      access: {
        currentUserId: currentUser.id
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
