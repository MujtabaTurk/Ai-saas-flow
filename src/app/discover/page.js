/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Star
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  demoBusinesses,
  discoveryCategories,
  filterDemoBusinesses
} from "@/features/discovery/demo-businesses";

export const metadata = {
  title: "Discover Businesses | ServiceFlow",
  description:
    "Search service businesses, compare categories, ratings, and locations, and preview a premium booking discovery experience."
};

const controlClassName =
  "h-12 rounded-[8px] border-[#c7c4d8] text-[#0b1c30] shadow-none focus-visible:border-[#3525cd] focus-visible:ring-[#3525cd]/15";
const selectContentClassName =
  "rounded-[8px] border-[#c7c4d8] text-[#0b1c30] shadow-sm";
const selectItemClassName =
  "rounded-[8px] data-[highlighted]:bg-[#eef4ff] data-[highlighted]:text-[#0b1c30]";
const selectIndicatorClassName = "text-[#3525cd]";

function getSearchParam(searchParams, key) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function getFilters(searchParams = {}) {
  return {
    business: getSearchParam(searchParams, "business"),
    service: getSearchParam(searchParams, "service"),
    category: getSearchParam(searchParams, "category"),
    location: getSearchParam(searchParams, "location"),
    rating: getSearchParam(searchParams, "rating")
  };
}

function buildDiscoverHref(filters, updates = {}) {
  const nextFilters = {
    ...filters,
    ...updates
  };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(nextFilters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return `/discover${query ? `?${query}` : ""}`;
}

function getLocations() {
  return [...new Set(demoBusinesses.map((business) => business.location))].sort();
}

function BusinessResultCard({ business }) {
  return (
    <article className="overflow-hidden rounded-[8px] border border-[#d8dff0] bg-white">
      <div className="aspect-[16/10] overflow-hidden bg-[#dfe7f6]">
        <img
          alt={`${business.name} location`}
          className="h-full w-full object-cover"
          src={business.imageUrl}
        />
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#3525cd]">
            {business.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <Star className="size-3.5 fill-current" aria-hidden="true" />
            {business.rating} ({business.reviews})
          </span>
        </div>
        <h2 className="mt-4 text-xl font-bold leading-7 text-[#0b1c30]">
          {business.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#586377]">
          {business.description}
        </p>
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#464555]">
          <MapPin className="size-4 text-[#3525cd]" aria-hidden="true" />
          {business.location}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {business.services.slice(0, 3).map((service) => (
            <span
              className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#464555]"
              key={service}
            >
              {service}
            </span>
          ))}
        </div>
        <Link
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[8px] bg-[#3525cd] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2f22b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/35"
          href={`/discover/${business.slug}`}
        >
          View Details
          <ArrowRight className="ms-2 size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default async function DiscoverPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const filters = getFilters(resolvedSearchParams);
  const minRating = Number.parseFloat(filters.rating);
  const locations = getLocations();
  const businesses = filterDemoBusinesses(filters).filter((business) => {
    if (!Number.isFinite(minRating)) {
      return true;
    }

    return business.rating >= minRating;
  });

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0b1c30]">
      <section className="border-b border-[#d8dff0] bg-white px-6 py-8">
        <div className="mx-auto max-w-[1280px]">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3525cd] hover:underline"
            href="/"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            ServiceFlow
          </Link>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.42fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#3525cd]">
                Discover
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
                Find businesses and services near you
              </h1>
              <p className="mt-4 max-w-[680px] text-base leading-7 text-[#464555]">
                Compare trusted demo businesses by category, service, rating,
                and location before moving into a booking-ready detail view.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="border-t border-[#d8dff0] pt-3">
                <p className="text-2xl font-bold">{demoBusinesses.length}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]">
                  Businesses
                </p>
              </div>
              <div className="border-t border-[#d8dff0] pt-3">
                <p className="text-2xl font-bold">{discoveryCategories.length}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]">
                  Categories
                </p>
              </div>
              <div className="border-t border-[#d8dff0] pt-3">
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]">
                  Avg rating
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-[1280px]">
          <form
            action="/discover"
            className="grid gap-3 rounded-[8px] border border-[#d8dff0] bg-white p-4 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.65fr_auto]"
          >
            <div className="block">
              <Label
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]"
                htmlFor="discover-business-search"
              >
                Search Business
              </Label>
              <Input
                className={controlClassName}
                defaultValue={filters.business}
                id="discover-business-search"
                name="business"
                placeholder="Elite Fitness Gym"
                type="search"
              />
            </div>
            <div className="block">
              <Label
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]"
                htmlFor="discover-service-search"
              >
                Search Service
              </Label>
              <Input
                className={controlClassName}
                defaultValue={filters.service}
                id="discover-service-search"
                name="service"
                placeholder="Dental, haircut, coaching"
                type="search"
              />
            </div>
            <div className="block">
              <Label
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]"
                htmlFor="discover-category-filter"
              >
                Category
              </Label>
              <Select
                className={controlClassName}
                contentClassName={selectContentClassName}
                defaultValue={filters.category}
                id="discover-category-filter"
                itemClassName={selectItemClassName}
                itemIndicatorClassName={selectIndicatorClassName}
                name="category"
              >
                <option value="">Any category</option>
                {discoveryCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            <div className="block">
              <Label
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]"
                htmlFor="discover-location-filter"
              >
                Location
              </Label>
              <Select
                className={controlClassName}
                contentClassName={selectContentClassName}
                defaultValue={filters.location}
                id="discover-location-filter"
                itemClassName={selectItemClassName}
                itemIndicatorClassName={selectIndicatorClassName}
                name="location"
              >
                <option value="">Any location</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Select>
            </div>
            <div className="block">
              <Label
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]"
                htmlFor="discover-rating-filter"
              >
                Rating
              </Label>
              <Select
                className={controlClassName}
                contentClassName={selectContentClassName}
                defaultValue={filters.rating}
                id="discover-rating-filter"
                itemClassName={selectItemClassName}
                itemIndicatorClassName={selectIndicatorClassName}
                name="rating"
              >
                <option value="">Any</option>
                <option value="4.9">4.9+</option>
                <option value="4.8">4.8+</option>
                <option value="4.7">4.7+</option>
              </Select>
            </div>
            <button
              className="mt-auto inline-flex h-12 items-center justify-center rounded-[8px] bg-[#3525cd] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2f22b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/35"
              type="submit"
            >
              <Search className="me-2 size-4" aria-hidden="true" />
              Search
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-full border border-[#c7c4d8] bg-white px-4 py-2 text-sm font-semibold text-[#464555] transition hover:border-[#3525cd] hover:text-[#3525cd]"
                href={buildDiscoverHref(filters, { category: "" })}
              >
                All categories
              </Link>
              {discoveryCategories.map((category) => (
                <Link
                  className="rounded-full border border-[#c7c4d8] bg-white px-4 py-2 text-sm font-semibold text-[#464555] transition hover:border-[#3525cd] hover:text-[#3525cd]"
                  href={buildDiscoverHref(filters, { category })}
                  key={category}
                >
                  {category}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#586377]">
              <SlidersHorizontal className="size-4 text-[#3525cd]" aria-hidden="true" />
              Showing {businesses.length} results
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#464555]">
            <Filter className="size-4 text-[#3525cd]" aria-hidden="true" />
            Demo discovery results
          </div>

          {businesses.length > 0 ? (
            <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {businesses.map((business) => (
                <BusinessResultCard business={business} key={business.slug} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[8px] border border-dashed border-[#c7c4d8] bg-white p-8 text-center">
              <h2 className="text-xl font-bold text-[#0b1c30]">
                No businesses match those filters
              </h2>
              <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-[#586377]">
                Try another service, category, location, or rating range.
              </p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[#c7c4d8] px-5 text-sm font-semibold text-[#0b1c30] transition hover:border-[#3525cd] hover:text-[#3525cd]"
                href="/discover"
              >
                Reset filters
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
