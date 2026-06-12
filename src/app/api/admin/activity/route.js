import {
  buildAdminPagination,
  getAdminPagination,
  requireSuperAdminContext
} from "@/features/admin/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireSuperAdminContext();
    const { searchParams } = new URL(request.url);
    const pagination = getAdminPagination(searchParams);

    if (!pagination) {
      return fail("Choose valid activity pagination values.", 422);
    }

    const [activity, totalItems] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: {
          createdAt: "desc"
        },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          reason: true,
          metadata: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          business: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }),
      prisma.auditLog.count()
    ]);

    return ok({
      activity,
      pagination: buildAdminPagination({
        ...pagination,
        totalItems
      })
    });
  } catch (error) {
    return handleApiError(error);
  }
}
