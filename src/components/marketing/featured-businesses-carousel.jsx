"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function getInitials(name) {
  return String(name || "Business")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function FeaturedBusinessCard({ business, index, isDuplicate = false }) {
  const { t } = useTranslation("public");
  const actionLabel = business.acceptingBookings
    ? t("featuredBusinesses.bookNow")
    : t("featuredBusinesses.viewBusiness");

  return (
    <Link
      aria-label={t("featuredBusinesses.viewDetails", { name: business.name })}
      className={cn(
        "business-showcase-card group/card",
        `business-showcase-card-${index % 6}`
      )}
      href={`/${business.slug}`}
      tabIndex={isDuplicate ? -1 : undefined}
    >
      {business.imageUrl ? (
        <img
          alt={t("featuredBusinesses.coverAlt", { name: business.name })}
          className="h-full w-full object-cover transition duration-700 group-hover/card:scale-[1.045]"
          draggable={false}
          src={business.imageUrl}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#eef4ff_0%,#d8e6ff_48%,#ecfdf5_100%)] text-5xl font-bold text-[#3525cd]">
          {getInitials(business.name)}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06121f]/80 via-[#06121f]/16 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
        <div className="mb-3 h-px w-10 bg-white/70 transition-all duration-300 group-hover/card:w-16" />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#dbe4ff] backdrop-blur">
            {business.category}
          </span>
          {business.rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-3 py-1 text-[11px] font-bold text-[#221700]">
              <Star className="size-3 fill-current" aria-hidden="true" />
              {business.rating}
              {business.reviewCount ? ` (${business.reviewCount})` : ""}
            </span>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h3 className="mt-1 truncate text-xl font-bold leading-7 sm:text-2xl">
              {business.name}
            </h3>
            <p className="mt-2 line-clamp-2 max-w-[19rem] text-sm font-medium leading-5 text-white/80">
              {business.description}
            </p>
          </div>
        </div>
        <span className="mt-5 inline-flex min-h-10 items-center rounded-[8px] bg-white px-4 text-sm font-bold text-[#0b1c30] transition-colors group-hover/card:bg-[#dbe4ff]">
          {actionLabel}
          <ArrowRight className="ms-2 size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function MarqueeGroup({ businesses, isDuplicate = false }) {
  return (
    <div
      aria-hidden={isDuplicate ? "true" : undefined}
      className="business-showcase-group"
    >
      {businesses.map((business, index) => (
        <FeaturedBusinessCard
          business={business}
          index={index}
          isDuplicate={isDuplicate}
          key={`${isDuplicate ? "duplicate" : "primary"}-${business.slug}`}
        />
      ))}
    </div>
  );
}

function MarqueeRow({ businesses, className, reverse = false }) {
  return (
    <div className={cn("business-showcase-row", className)}>
      <div
        className={cn(
          "business-showcase-track",
          reverse && "business-showcase-track-reverse"
        )}
      >
        <MarqueeGroup businesses={businesses} />
        <MarqueeGroup businesses={businesses} isDuplicate />
      </div>
    </div>
  );
}

export function FeaturedBusinessesCarousel({ businesses = [] }) {
  const { t } = useTranslation("public");
  const visibleBusinesses = businesses.slice(0, 8);
  const reverseBusinesses = [...visibleBusinesses].reverse();

  if (visibleBusinesses.length === 0) {
    return (
      <section
        aria-label={t("featuredBusinesses.ariaLabel")}
        className="mx-auto max-w-[1280px] px-8"
      >
        <div className="rounded-[8px] border border-dashed border-[#c7c4d8] bg-white/80 p-8 text-center">
          <p className="text-sm font-semibold text-[#586377]">
            {t("featuredBusinesses.emptyDescription")}
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[#3525cd] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2f22b6]"
            href="/businesses"
          >
            {t("landing.featured.cta")}
            <ArrowRight className="ms-2 size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={t("featuredBusinesses.ariaLabel")}
      className="business-showcase overflow-hidden py-2"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-28 bg-gradient-to-r from-[#f4f7ff] to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-28 bg-gradient-to-l from-[#f4f7ff] to-transparent sm:block" />

      <MarqueeRow businesses={visibleBusinesses} />
      <MarqueeRow
        businesses={reverseBusinesses}
        className="mt-6"
        reverse
      />
    </section>
  );
}
