import { PublicBookingManager } from "@/features/bookings/components/public-booking-manager";

export const metadata = {
  title: "Manage booking | ServiceFlow"
};

export default async function PublicBookingPage({ params, searchParams }) {
  const { businessSlug, bookingNumber } = await params;
  const { token } = await searchParams;

  return (
    <main className="min-h-screen bg-growth-dashboard px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <PublicBookingManager
          businessSlug={businessSlug}
          bookingNumber={bookingNumber}
          token={typeof token === "string" ? token : ""}
        />
      </div>
    </main>
  );
}
