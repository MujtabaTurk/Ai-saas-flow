import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Clock3,
  CreditCard,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Star,
  Users
} from "lucide-react";
import { LocaleBoundary } from "@/components/i18n/locale-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicBookingForm } from "@/features/bookings/components/public-booking-form";
import { getBusinessDiscoveryDetail } from "@/features/businesses/discovery";
import { normalizeWebsiteUrl } from "@/features/businesses/url";
import { getIntervalLabel } from "@/features/memberships/lifecycle";
import { PublicMembershipEnrollment } from "@/features/memberships/components/public-membership-enrollment";
import { ReviewStars } from "@/features/reviews/components/review-stars";
import {
  formatLocalizedDateTime,
  formatLocalizedMoney
} from "@/i18n/format";
import { resolveRequestLanguage } from "@/i18n/server";

export const metadata = {
  title: "Business Details | ServiceFlow",
  description:
    "View business services, reviews, availability, and book an appointment on ServiceFlow."
};

function getInitials(name) {
  return String(name || "Business")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function formatPrice(service, language) {
  if (service.priceCents === null || service.priceCents === undefined) {
    return "Free";
  }

  return formatLocalizedMoney(service.priceCents, service.currency, language);
}

function formatPlanPrice(plan, language) {
  return `${formatLocalizedMoney(
    plan.priceCents,
    plan.currency,
    language
  )}/${getIntervalLabel(plan.billingInterval)}`;
}

function ContactRow({ icon: Icon, children }) {
  if (!children) {
    return null;
  }

  return (
    <p className="flex items-center gap-3 text-sm text-slate-600">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-growth-sidebar">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ServiceList({ business, language }) {
  return (
    <section className="space-y-4" id="services">
      <SectionHeading
        description="Choose from active public services. The booking form uses the same live slots shown by the business."
        eyebrow="Services"
        title="Services you can book"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {business.services.map((service) => (
          <article
            className="rounded-2xl bg-white p-5 shadow-sm"
            key={service.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-growth-sidebar">
                  {service.name}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="size-4" aria-hidden="true" />
                  {service.durationMin} minutes
                </p>
              </div>
              <p className="shrink-0 font-bold text-primary">
                {formatPrice(service, language)}
              </p>
            </div>
            {service.description ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {service.description}
              </p>
            ) : null}
            <Button asChild className="mt-5" size="sm" variant="outline">
              <Link href="#book">
                Select service
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

function MembershipPlanList({ business, language }) {
  if (business.membershipPlans.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" id="memberships">
      <SectionHeading
        description="Active public membership plans from this business."
        eyebrow="Memberships"
        title="Plans you can join"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {business.membershipPlans.map((plan) => (
          <article
            className="rounded-2xl bg-white p-5 shadow-sm"
            key={plan.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-growth-sidebar">
                  {plan.name}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="size-4" aria-hidden="true" />
                  {plan.durationDays} days
                </p>
              </div>
              <p className="shrink-0 font-bold text-primary">
                {formatPlanPrice(plan, language)}
              </p>
            </div>
            {plan.description ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {plan.description}
              </p>
            ) : null}
            {Array.isArray(plan.features) && plan.features.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.features.slice(0, 4).map((feature) => (
                  <Badge key={feature} variant="outline">{feature}</Badge>
                ))}
              </div>
            ) : null}
            <Button asChild className="mt-5" size="sm" variant="outline">
              <Link href="#memberships-join">
                Select plan
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

function TeamMembers({ members }) {
  if (members.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionHeading
        description="Active team members connected to this business workspace."
        eyebrow="Team"
        title="People behind the service"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
            key={member.id}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-growth-mint font-bold text-growth-sidebar">
              {getInitials(member.name)}
            </div>
            <div>
              <p className="font-semibold text-growth-sidebar">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Availability({ business, language }) {
  return (
    <section className="space-y-4">
      <SectionHeading
        description={`Times are shown in ${business.timezone}.`}
        eyebrow="Availability"
        title="Upcoming appointment times"
      />

      {business.upcomingSlots.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {business.upcomingSlots.map((slot) => (
            <Link
              className="rounded-2xl bg-white p-4 shadow-sm transition-colors duration-150 hover:bg-growth-dashboard"
              href="#book"
              key={`${slot.serviceId}-${slot.startsAt}`}
            >
              <p className="font-bold text-growth-sidebar">
                {formatLocalizedDateTime(
                  slot.startsAt,
                  business.timezone,
                  language,
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                  }
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {slot.serviceName}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-5 text-sm text-muted-foreground shadow-sm">
          No public slots are available in the current booking window.
        </div>
      )}

      {business.availability.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {business.availability.map((day) => (
            <div
              className="rounded-2xl bg-white p-4 shadow-sm"
              key={day.value}
            >
              <p className="font-bold text-growth-sidebar">{day.label}</p>
              <div className="mt-3 space-y-2">
                {day.ranges.map((range) => (
                  <div
                    className="flex items-center justify-between gap-3 text-sm"
                    key={`${day.value}-${range.time}-${range.serviceName}`}
                  >
                    <span className="text-slate-600">{range.time}</span>
                    <Badge variant="outline">{range.serviceName}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Reviews({ business }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <SectionHeading
          description="Published reviews are verified against completed bookings."
          eyebrow="Reviews"
          title="Customer feedback"
        />
        {business.reviewSummary.total > 0 ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <ReviewStars rating={Math.round(business.reviewSummary.averageRating)} />
            <span className="text-sm font-semibold text-growth-sidebar">
              {business.reviewSummary.averageRating} from{" "}
              {business.reviewSummary.total} reviews
            </span>
          </div>
        ) : null}
      </div>

      {business.reviews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {business.reviews.map((review) => (
            <article
              className="rounded-2xl bg-white p-5 shadow-sm"
              key={review.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ReviewStars rating={review.rating} />
                <Badge variant="outline">{review.serviceNameSnapshot}</Badge>
              </div>
              <h3 className="mt-4 font-bold text-growth-sidebar">
                {review.title || "Verified customer review"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {review.comment}
              </p>
              <p className="mt-4 text-sm font-semibold text-growth-sidebar">
                {review.customerName}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-5 text-sm text-muted-foreground shadow-sm">
          This business has not published customer reviews yet.
        </div>
      )}
    </section>
  );
}

export default async function BusinessDiscoveryDetailPage({ params }) {
  const { slug } = await params;
  const business = await getBusinessDiscoveryDetail(slug);

  if (!business) {
    notFound();
  }

  const language = await resolveRequestLanguage(business.locale);
  const websiteUrl = normalizeWebsiteUrl(business.website);
  const hasPublicActions =
    business.acceptingBookings || business.membershipPlans.length > 0;

  return (
    <LocaleBoundary language={language}>
      <main className="min-h-screen bg-slate-50 text-growth-sidebar">
        <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              href="/businesses"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Businesses
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {business.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="size-24 rounded-2xl border border-growth-border object-cover"
                    src={business.logoUrl}
                  />
                ) : (
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-growth-mint text-3xl font-bold text-growth-sidebar">
                    {getInitials(business.name)}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {business.industry ? (
                      <Badge variant="outline">{business.industry}</Badge>
                    ) : null}
                    {business.acceptingBookings ? (
                      <Badge variant="success">Accepting bookings</Badge>
                    ) : (
                      <Badge variant="warning">Bookings unavailable</Badge>
                    )}
                    {business.membershipPlans.length > 0 ? (
                      <Badge variant="success">Memberships available</Badge>
                    ) : null}
                    {business.reviewSummary.total > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        <Star className="size-3.5 fill-current" aria-hidden="true" />
                        {business.reviewSummary.averageRating} (
                        {business.reviewSummary.total})
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                    {business.name}
                  </h1>
                  {business.description ? (
                    <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                      {business.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="space-y-3">
                  <ContactRow icon={MapPin}>{business.address || business.location}</ContactRow>
                  <ContactRow icon={Clock3}>{business.timezone}</ContactRow>
                  <ContactRow icon={Mail}>
                    {business.email ? (
                      <a className="hover:text-primary" href={`mailto:${business.email}`}>
                        {business.email}
                      </a>
                    ) : null}
                  </ContactRow>
                  <ContactRow icon={Phone}>
                    {business.phone ? (
                      <a className="hover:text-primary" href={`tel:${business.phone}`}>
                        {business.phone}
                      </a>
                    ) : null}
                  </ContactRow>
                  <ContactRow icon={Globe2}>
                    {websiteUrl ? (
                      <a
                        className="inline-flex items-center gap-1 hover:text-primary"
                        href={websiteUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Website
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </ContactRow>
                </div>
                <Button asChild className="mt-5 w-full" disabled={!hasPublicActions}>
                  <Link href={business.acceptingBookings ? "#book" : "#memberships-join"}>
                    {business.acceptingBookings ? "Book now" : "View plans"}
                    <CalendarCheck2 className="ml-2 size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_25rem]">
            <div className="space-y-10">
              {business.services.length > 0 ? (
                <ServiceList business={business} language={language} />
              ) : null}
              <MembershipPlanList business={business} language={language} />
              <TeamMembers members={business.teamMembers} />
              <Availability business={business} language={language} />
              <Reviews business={business} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" id="book">
              {business.acceptingBookings ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                      Book appointment
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-growth-sidebar">
                      Select a service and time
                    </h2>
                  </div>
                  <PublicBookingForm
                    business={{
                      name: business.name,
                      logoUrl: business.logoUrl,
                      slug: business.slug,
                      timezone: business.timezone,
                      bookingWindowDays: business.settings.bookingWindowDays
                    }}
                    services={business.services}
                    language={language}
                  />
                </div>
              ) : null}

              {business.membershipPlans.length > 0 ? (
                <div id="memberships-join">
                  <PublicMembershipEnrollment
                    business={{
                      name: business.name,
                      slug: business.slug,
                      timezone: business.timezone
                    }}
                    language={language}
                    plans={business.membershipPlans}
                  />
                </div>
              ) : null}

              {!business.acceptingBookings && business.membershipPlans.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-white p-6 text-sm text-amber-800 shadow-sm">
                  This business is not accepting new public bookings right now.
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      </main>
    </LocaleBoundary>
  );
}
