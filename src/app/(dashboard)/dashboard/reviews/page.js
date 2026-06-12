import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isSuperAdmin } from "@/features/auth/permissions";
import { ReviewManagement } from "@/features/reviews/components/review-management";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Reviews | ServiceFlow"
};

export default async function ReviewsPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId) {
    redirect("/onboarding");
  }

  if (
    !isSuperAdmin(session.user) &&
    !["OWNER", "ADMIN"].includes(session.user.businessRole)
  ) {
    redirect("/dashboard/bookings");
  }

  const business = await prisma.business.findUnique({
    where: {
      id: session.user.activeBusinessId
    },
    select: {
      id: true,
      name: true,
      status: true,
      timezone: true
    }
  });

  if (!business) {
    redirect("/onboarding");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">{business.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Reviews
          </h1>
          <p className="text-muted-foreground">
            Moderate verified customer feedback before it appears on the public
            booking page.
          </p>
        </div>
        <ReviewManagement
          businessId={business.id}
          businessTimezone={business.timezone}
          isReadOnly={
            business.status !== "ACTIVE" && !isSuperAdmin(session.user)
          }
        />
      </div>
    </AppShell>
  );
}
