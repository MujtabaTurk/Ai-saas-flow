import { Clock3, Mail, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { LocaleBoundary } from "@/components/i18n/locale-boundary";
import { PublicBookingForm } from "@/features/bookings/components/public-booking-form";
import { getBookingCreationAccess } from "@/features/bookings/access";
import { getBookingSettings } from "@/features/bookings/lifecycle";
import { getBusinessForBooking } from "@/features/bookings/server";
import { ReviewStars } from "@/features/reviews/components/review-stars";
import {
  getPublicReviewSummary,
  mapPublicReview,
  publicReviewSelect
} from "@/features/reviews/server";
import { formatLocalizedMoney } from "@/i18n/format";
import {
  getServerTranslator,
  resolveRequestLanguage
} from "@/i18n/server";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Book an appointment | ServiceFlow"
};

function formatPrice(service, language, t) {
  if (service.priceCents === null || service.priceCents === undefined) {
    return t("booking.free");
  }

  return formatLocalizedMoney(
    service.priceCents,
    service.currency,
    language
  );
}

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

  const [services, publishedReviews, reviewSummary] = await Promise.all([
    prisma.service.findMany({
      where: {
        businessId: business.id,
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
    }),
    prisma.review.findMany({
      where: {
        businessId: business.id,
        status: "PUBLISHED"
      },
      orderBy: {
        publishedAt: "desc"
      },
      take: 6,
      select: publicReviewSelect
    }),
    getPublicReviewSummary(business.id)
  ]);
  const reviews = publishedReviews.map(mapPublicReview);
  const settings = getBookingSettings(business.settings);
  const access = await getBookingCreationAccess({ business });
  const language = await resolveRequestLanguage(business.locale);
  const t = await getServerTranslator(language, "public");
  const acceptingBookings =
    access.canCreate && settings.allowGuestBookings && services.length > 0;

  return (
    <LocaleBoundary language={language}>
      <main className="min-h-screen bg-growth-dashboard px-4 py-10 text-growth-sidebar sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-6">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-growth-mint/50 px-3 py-1 text-sm font-semibold text-growth-dark">
              {t("page.onlineBooking")}
            </p>
            <h1 className="text-4xl font-bold tracking-tight">{business.name}</h1>
            {business.description ? (
              <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
                {business.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 rounded-2xl border border-growth-border bg-white p-5 shadow-sm">
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4 text-primary" />
              {t("page.timesShown", { timezone: business.timezone })}
            </p>
            {business.email ? (
              <p className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                {business.email}
              </p>
            ) : null}
            {business.phone ? (
              <p className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                {business.phone}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold">{t("page.services")}</h2>
            {services.map((service) => (
              <article
                className="rounded-2xl border border-growth-border bg-white p-5 shadow-sm"
                key={service.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{service.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("booking.minutes", {
                        count: service.durationMin
                      })}
                    </p>
                  </div>
                  <p className="font-bold text-primary">
                    {formatPrice(service, language, t)}
                  </p>
                </div>
                {service.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {service.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">
                  {t("page.customerReviews")}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ReviewStars rating={Math.round(reviewSummary.averageRating)} />
                  <span>
                    {t("page.reviewSummary", {
                      rating: reviewSummary.averageRating,
                      count: reviewSummary.total
                    })}
                  </span>
                </div>
              </div>
              {reviews.map((review) => (
                <article
                  className="rounded-2xl border border-growth-border bg-white p-5 shadow-sm"
                  key={review.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ReviewStars rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {review.serviceNameSnapshot}
                    </span>
                  </div>
                  <h3 className="mt-3 font-bold">
                    {review.title || t("page.verifiedReview")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {review.comment}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-growth-sidebar">
                    {review.customerName}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section>
          {acceptingBookings ? (
            <PublicBookingForm
              business={{
                name: business.name,
                slug: business.slug,
                timezone: business.timezone,
                bookingWindowDays: settings.bookingWindowDays
              }}
              services={services}
            />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold">
                {t("page.bookingUnavailable")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("page.bookingUnavailableDescription")}
              </p>
            </div>
          )}
        </section>
        </div>
      </main>
    </LocaleBoundary>
  );
}
