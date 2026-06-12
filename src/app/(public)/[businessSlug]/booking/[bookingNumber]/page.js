import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocaleBoundary } from "@/components/i18n/locale-boundary";
import { PublicBookingManager } from "@/features/bookings/components/public-booking-manager";
import { getBusinessForBooking } from "@/features/bookings/server";
import { resolveRequestLanguage } from "@/i18n/server";

export const metadata = {
  title: "Manage booking | ServiceFlow"
};

export default async function PublicBookingPage({ params, searchParams }) {
  const { businessSlug, bookingNumber } = await params;
  const { token } = await searchParams;
  let business;

  try {
    business = await getBusinessForBooking({
      slug: businessSlug
    });
  } catch (error) {
    if (error?.status === 404) {
      notFound();
    }

    throw error;
  }

  const language = await resolveRequestLanguage(business.locale);

  return (
    <LocaleBoundary language={language}>
      <main className="min-h-screen bg-growth-dashboard px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex justify-end">
            <LanguageSwitcher />
          </div>
          <PublicBookingManager
            businessSlug={businessSlug}
            bookingNumber={bookingNumber}
            token={typeof token === "string" ? token : ""}
          />
        </div>
      </main>
    </LocaleBoundary>
  );
}
