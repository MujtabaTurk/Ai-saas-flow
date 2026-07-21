import { assertBusinessAccess, isBusinessOwner, isSuperAdmin } from "@/features/auth/permissions";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request) {
  try {
    const session = await getCurrentSession();
    const user = session?.user;

    if (!user) {
      return fail("Authentication is required.", 401);
    }

    if (!isBusinessOwner(user) && !isSuperAdmin(user)) {
      return fail("Only business owners can access wallet transactions.", 403);
    }

    assertBusinessAccess(user, user.activeBusinessId);

    const business = await prisma.business.findFirst({
      where: isSuperAdmin(user)
        ? { id: user.activeBusinessId }
        : { id: user.activeBusinessId, ownerId: user.id },
      select: { id: true }
    });

    if (!business) {
      return fail("You cannot access records for this business.", 403);
    }

    const searchParams = new URL(request.url).searchParams;
    const page = positiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      positiveInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const where = { wallet: { businessId: business.id } };

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          createdAt: true,
          type: true,
          status: true,
          amount: true,
          referenceType: true,
          referenceId: true,
          notes: true
        }
      }),
      prisma.walletTransaction.count({ where })
    ]);

    return ok({
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
