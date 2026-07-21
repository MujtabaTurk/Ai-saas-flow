import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarCheck2,
  Clock3,
  CreditCard,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getBusinessDirectory
} from "@/features/businesses/discovery";
import { getIntervalLabel } from "@/features/memberships/lifecycle";
import { formatLocalizedMoney } from "@/i18n/format";
import { resolveRequestLanguage } from "@/i18n/server";

export const metadata = {
  title: "Businesses | ServiceFlow",
  description:
    "Discover service businesses, compare services and reviews, and book appointments on ServiceFlow."
};

const selectClassName =
  "flex h-11 w-full rounded-2xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:shadow-none";

function buildDirectoryHref(filters, updates = {}) {
  const nextFilters = {
    ...filters,
    ...updates
  };
  const params = new URLSearchParams();

  if (nextFilters.q) {
    params.set("q", nextFilters.q);
  }

  if (nextFilters.industry) {
    params.set("industry", nextFilters.industry);
  }

  if (nextFilters.city) {
    params.set("city", nextFilters.city);
  }

  if (nextFilters.sort && nextFilters.sort !== "recommended") {
    params.set("sort", nextFilters.sort);
  }

  if (nextFilters.page && nextFilters.page > 1) {
    params.set("page", String(nextFilters.page));
  }

  const query = params.toString();

  return `/businesses${query ? `?${query}` : ""}`;
}

function getInitials(name) {
  return String(name || "Business")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function formatServicePrice(service, language) {
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

function RatingPill({ summary }) {
  if (!summary?.total) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
        <Star className="size-3.5" aria-hidden="true" />
        New
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning-bg))] px-3 py-1 text-xs font-semibold text-[hsl(var(--warning-foreground))]">
      <Star className="size-3.5 fill-current" aria-hidden="true" />
      {summary.averageRating} ({summary.total})
    </span>
  );
}

function DirectoryFilters({ facets, filters }) {
  const hasFilters =
    filters.q || filters.industry || filters.city || filters.sort !== "recommended";

  return (
    <Card className="border-growth-border bg-card">
      <CardContent className="p-5">
        <form action="/businesses" className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              className="pl-11"
              defaultValue={filters.q}
              name="q"
              placeholder="Search businesses, services, or locations"
            />
          </div>
          <label className="sr-only" htmlFor="industry-filter">
            Industry
          </label>
          <Select
            className={selectClassName}
            defaultValue={filters.industry}
            id="industry-filter"
            name="industry"
          >
            <option value="">All industries</option>
            {facets.industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </Select>
          <label className="sr-only" htmlFor="city-filter">
            City
          </label>
          <Select
            className={selectClassName}
            defaultValue={filters.city}
            id="city-filter"
            name="city"
          >
            <option value="">All cities</option>
            {facets.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
          <label className="sr-only" htmlFor="sort-filter">
            Sort
          </label>
          <Select
            className={selectClassName}
            defaultValue={filters.sort}
            id="sort-filter"
            name="sort"
          >
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
          </Select>
          <div className="flex gap-2">
            <Button className="flex-1 xl:flex-none" type="submit">
              <Filter className="mr-2 size-4" aria-hidden="true" />
              Apply
            </Button>
            {hasFilters ? (
              <Button asChild variant="outline">
                <Link href="/businesses">Clear</Link>
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function BusinessCard({ business, language }) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-card p-5 text-card-foreground shadow-sm transition-colors duration-150 hover:bg-accent/25 dark:hover:bg-accent/35">
      <div className="flex items-start gap-4">
        {business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="size-14 rounded-2xl object-cover"
            src={business.logoUrl}
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-growth-mint font-bold text-growth-sidebar">
            {getInitials(business.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {business.industry ? <Badge variant="outline">{business.industry}</Badge> : null}
            <RatingPill summary={business.reviewSummary} />
          </div>
          <Link
            className="mt-3 block text-xl font-bold text-growth-sidebar transition hover:text-primary"
            href={`/${business.slug}`}
          >
            {business.name}
          </Link>
          {business.location ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              {business.location}
            </p>
          ) : null}
        </div>
      </div>

      {business.description ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {business.description}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Service business accepting online discovery through ServiceFlow.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {business.services.map((service) => (
          <div
            className="rounded-2xl bg-growth-dashboard p-3"
            key={service.id}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-growth-sidebar">{service.name}</p>
              <p className="shrink-0 text-sm font-bold text-primary">
                {formatServicePrice(service, language)}
              </p>
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {service.durationMin} min
            </p>
          </div>
        ))}
        {business.membershipPlans.map((plan) => (
          <div
            className="rounded-2xl bg-growth-dashboard p-3"
            key={plan.id}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-growth-sidebar">{plan.name}</p>
              <p className="shrink-0 text-sm font-bold text-primary">
                {formatPlanPrice(plan, language)}
              </p>
            </div>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <CreditCard className="size-3.5" aria-hidden="true" />
              {plan.durationDays} days
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <Button asChild className="w-full">
          <Link href={`/${business.slug}`}>
            {business.acceptingBookings
              ? "Book now"
              : business.membershipPlans.length > 0
                ? "View plans"
                : "View business"}
          </Link>
        </Button>
      </div>
    </article>
  );
}

function Pagination({ filters, pagination }) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Businesses pagination"
      className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-sm sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          asChild
          disabled={!pagination.hasPreviousPage}
          variant="outline"
        >
          <Link
            href={buildDirectoryHref(filters, {
              page: Math.max(pagination.page - 1, 1)
            })}
          >
            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
            Previous
          </Link>
        </Button>
        <Button asChild disabled={!pagination.hasNextPage} variant="outline">
          <Link
            href={buildDirectoryHref(filters, {
              page: pagination.page + 1
            })}
          >
            Next
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </nav>
  );
}

export default async function BusinessesDirectoryPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const language = await resolveRequestLanguage();
  const { businesses, facets, filters, pagination } =
    await getBusinessDirectory(resolvedSearchParams);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-growth-border bg-card px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              href="/"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              ServiceFlow
            </Link>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Discover businesses
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Search active service businesses, compare services and ratings,
              then book from the same public booking flow.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-growth-dashboard p-4">
              <Building2 className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold">{pagination.totalItems}</p>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Businesses
              </p>
            </div>
            <div className="rounded-2xl bg-growth-dashboard p-4">
              <SlidersHorizontal className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold">{facets.industries.length}</p>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Industries
              </p>
            </div>
            <div className="hidden rounded-2xl bg-growth-dashboard p-4 sm:block">
              <CalendarCheck2 className="size-5 text-[hsl(var(--warning-foreground))]" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold">
                {businesses.filter((business) => business.acceptingBookings).length}
              </p>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Bookable now
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <DirectoryFilters facets={facets} filters={filters} />

          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              Showing {businesses.length} of {pagination.totalItems} businesses
            </p>
            <p className="text-sm text-muted-foreground">
              Public booking, services, and reviews are connected live.
            </p>
          </div>

          {businesses.length === 0 ? (
            <EmptyState
              action={
                <Button asChild variant="outline">
                  <Link href="/businesses">Reset filters</Link>
                </Button>
              }
              description="Try a broader search term or clear one of the directory filters."
              title="No businesses match those filters"
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {businesses.map((business) => (
                <BusinessCard
                  business={business}
                  key={business.id}
                  language={language}
                />
              ))}
            </div>
          )}

          <Pagination filters={filters} pagination={pagination} />
        </div>
      </section>
    </main>
  );
}
