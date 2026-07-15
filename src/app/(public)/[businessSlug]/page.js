import { notFound } from "next/navigation";
import { LocaleBoundary } from "@/components/i18n/locale-boundary";
import { PublicBookingForm } from "@/features/bookings/components/public-booking-form";
import { getBookingCreationAccess } from "@/features/bookings/access";
import { getBookingSettings } from "@/features/bookings/lifecycle";
import { getBusinessForBooking } from "@/features/bookings/server";
import {
  getServerTranslator,
  resolveRequestLanguage
} from "@/i18n/server";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Book an appointment | ServiceFlow"
};

export default async function PublicBusinessPage({ params }) {
  const { businessSlug } = await params;
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

  const services = await prisma.service.findMany({
      where: {
        businessId: business.id,
        type: "BOOKING",
        isActive: true
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMin: true,
        priceCents: true,
        currency: true,
        requiresPayment: true
      }
  });
  const settings = getBookingSettings(business.settings);
  const access = await getBookingCreationAccess({ business });
  const language = await resolveRequestLanguage(business.locale);
  const t = await getServerTranslator(language, "public");
  const acceptingBookings =
    access.canCreate && settings.allowGuestBookings && services.length > 0;

  return (
    <LocaleBoundary language={language}>
      <main className="min-h-screen bg-growth-dashboard px-4 py-10 text-growth-sidebar sm:px-6 lg:h-dvh lg:overflow-hidden">
        <div className="mx-auto w-full max-w-4xl lg:flex lg:h-full lg:min-h-0 lg:flex-col">
          <header className="mx-auto mb-8 max-w-3xl lg:shrink-0">
            <p className="mb-3 inline-flex rounded-full bg-growth-mint/50 px-3 py-1 text-sm font-semibold text-growth-dark">
              {t("page.onlineBooking")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{business.name}</h1>
            {business.description ? <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{business.description}</p> : null}
          </header>

          {acceptingBookings ? (
            <div className="lg:min-h-0 lg:flex-1">
              <PublicBookingForm
                business={{
                  name: business.name,
                  description: business.description,
                  industry: business.industry,
                  logoUrl: business.logoUrl,
                  slug: business.slug,
                  timezone: business.timezone,
                  bookingWindowDays: settings.bookingWindowDays
                }}
                services={services}
                language={language}
              />
            </div>
          ) : null}
          {!acceptingBookings ? (
            <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold">
                {t("page.bookingUnavailable")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("page.bookingUnavailableDescription")}
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </LocaleBoundary>
  );
}
