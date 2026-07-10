import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/features/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const DASHBOARD_MANAGER_ROLES = ["OWNER", "ADMIN"];

function canManageDashboard(user) {
  return (
    isSuperAdmin(user) ||
    DASHBOARD_MANAGER_ROLES.includes(user?.businessRole)
  );
}

export async function requireDashboardPageSession() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId) {
    redirect("/onboarding");
  }

  return session;
}

export async function requireDashboardPageBusiness({
  requireBusinessManager = false,
  select
}) {
  const session = await requireDashboardPageSession();

  if (requireBusinessManager && !canManageDashboard(session.user)) {
    redirect("/dashboard/bookings");
  }

  const business = await prisma.business.findUnique({
    where: {
      id: session.user.activeBusinessId
    },
    select
  });

  if (!business) {
    redirect("/onboarding");
  }

  return {
    business,
    session
  };
}
