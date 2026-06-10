import {
  assertBusinessManagement,
  assertBusinessWriteAccess,
  assertSuperAdmin,
  canAccessDashboard
} from "@/features/auth/permissions";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function requireSuperAdminUser() {
  const user = await requireCurrentUser();
  assertSuperAdmin(user);

  return user;
}

export async function requireDashboardUser() {
  const user = await requireCurrentUser();

  if (!canAccessDashboard(user)) {
    throw new AppError("Business onboarding is required before accessing the dashboard.", 409);
  }

  return user;
}

export async function requireBusinessContext({ write = false } = {}) {
  const user = await requireDashboardUser();

  if (!user.activeBusinessId) {
    throw new AppError("Business onboarding is required before accessing this resource.", 409);
  }

  assertBusinessManagement(user, user.activeBusinessId);

  const business = await prisma.business.findUnique({
    where: {
      id: user.activeBusinessId
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      timezone: true,
      currency: true,
      locale: true
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  if (write) {
    assertBusinessWriteAccess(user, business);
  }

  return {
    user,
    business
  };
}
