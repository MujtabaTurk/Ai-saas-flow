import { AppShell } from "@/components/layout/app-shell";
import { BookingManagement } from "@/features/bookings/components/booking-management";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";

export const metadata = {
  title: "Bookings | ServiceFlow"
};

export default async function BookingsPage() {
  const { business, session } = await requireDashboardPageBusiness({
    select: {
      id: true,
      name: true,
      status: true,
      timezone: true
    }
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">{business.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Booking Management
          </h1>
          <p className="text-muted-foreground">
            Review appointments, manage their lifecycle, and configure online booking rules.
          </p>
        </div>

        <BookingManagement
          businessId={business.id}
          timezone={business.timezone}
          isReadOnly={business.status !== "ACTIVE"}
          businessRole={session.user.businessRole}
        />
      </div>
    </AppShell>
  );
}
