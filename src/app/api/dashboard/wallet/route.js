import { assertBusinessAccess, isBusinessOwner, isSuperAdmin } from "@/features/auth/permissions";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const EMPTY_WALLET = {
  availableCredits: 0,
  pendingCredits: 0,
  holdCredits: 0,
  withdrawnCredits: 0,
  lifetimeCredits: 0,
  monthlyRevenue: 0,
  currency: "USD"
};

export async function GET() {
  try {
    const session = await getCurrentSession();
    const user = session?.user;

    if (!user) {
      return fail("Authentication is required.", 401);
    }

    if (!isBusinessOwner(user) && !isSuperAdmin(user)) {
      return fail("Only business owners can access wallet balances.", 403);
    }

    assertBusinessAccess(user, user.activeBusinessId);

    const business = await prisma.business.findFirst({
      where: isSuperAdmin(user)
        ? { id: user.activeBusinessId }
        : { id: user.activeBusinessId, ownerId: user.id },
      select: { id: true, currency: true }
    });

    if (!business) {
      return fail("You cannot access records for this business.", 403);
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        businessId: business.id
      },
      select: {
        availableCredits: true,
        pendingCredits: true,
        holdCredits: true,
        withdrawnCredits: true,
        lifetimeCredits: true,
        monthlyRevenue: true,
        currency: true
      }
    });

    return ok({
      wallet: wallet
        ? { ...wallet, businessId: business.id, currentBalance: wallet.availableCredits + wallet.pendingCredits + wallet.holdCredits }
        : { ...EMPTY_WALLET, businessId: business.id, currency: business.currency?.toUpperCase() || EMPTY_WALLET.currency }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
