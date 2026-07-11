import { isSuperAdmin } from "@/features/auth/permissions";
import { ReviewManagement } from "@/features/reviews/components/review-management";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";

export const metadata = {
  title: "Reviews | ServiceFlow"
};

export default async function ReviewsPage() {
  const { business, session } = await requireDashboardPageBusiness({
    requireBusinessManager: true,
    select: {
      id: true,
      name: true,
      status: true,
      timezone: true
    }
  });

  return (
    <>
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
    </>
  );
}
