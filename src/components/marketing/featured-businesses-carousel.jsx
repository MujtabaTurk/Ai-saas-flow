"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const landingShowcaseBusinesses = [
  {
    slug: "atlas-fitness-studio",
    href: "/businesses",
    name: "Atlas Fitness Studio",
    category: "Fitness Studio",
    description:
      "A high-energy training studio for strength classes, mobility work, and coached small-group programs.",
    rating: 4.9,
    reviewCount: 248,
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85"
  },
  {
    slug: "luma-beauty-salon",
    href: "/businesses",
    name: "Luma Beauty Salon",
    category: "Beauty Salon",
    description:
      "A polished salon experience for precision cuts, color refreshes, blowouts, and event-ready styling.",
    rating: 4.8,
    reviewCount: 196,
    imageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85"
  },
  {
    slug: "northstar-medical-clinic",
    href: "/businesses",
    name: "Northstar Medical Clinic",
    category: "Medical Clinic",
    description:
      "A modern care clinic offering preventive visits, wellness checks, and patient-friendly appointment access.",
    rating: 4.9,
    reviewCount: 312,
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=85"
  },
  {
    slug: "pearl-dental-practice",
    href: "/businesses",
    name: "Pearl Dental Practice",
    category: "Dental Practice",
    description:
      "A family dental practice for cleanings, whitening, preventive care, and confident routine bookings.",
    rating: 4.9,
    reviewCount: 341,
    imageUrl:
      "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=85"
  },
  {
    slug: "haven-spa-wellness",
    href: "/businesses",
    name: "Haven Spa & Wellness",
    category: "Spa & Wellness Center",
    description:
      "A restorative wellness center for massage therapy, recovery rituals, skincare, and calm recurring care.",
    rating: 4.8,
    reviewCount: 224,
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=85"
  },
  {
    slug: "forma-personal-training",
    href: "/businesses",
    name: "Forma Personal Training",
    category: "Personal Trainer",
    description:
      "A focused coaching practice for custom fitness plans, private strength sessions, and progress reviews.",
    rating: 4.9,
    reviewCount: 178,
    imageUrl:
      "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=1200&q=85"
  },
  {
    slug: "clarity-consulting-agency",
    href: "/businesses",
    name: "Clarity Consulting Agency",
    category: "Consulting Agency",
    description:
      "A boutique advisory team helping founders refine operations, pricing, finance plans, and growth systems.",
    rating: 4.9,
    reviewCount: 86,
    imageUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85"
  },
  {
    slug: "elevate-coaching-service",
    href: "/businesses",
    name: "Elevate Coaching Service",
    category: "Coaching Service",
    description:
      "A structured coaching service for career planning, skills growth, exam prep, and accountability sessions.",
    rating: 4.7,
    reviewCount: 132,
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85"
  }
];

function getInitials(name) {
  return String(name || "Business")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function normalizeBusiness(business) {
  return {
    ...business,
    acceptingBookings: Boolean(business.acceptingBookings),
    category: business.category || "Service business",
    href: business.href || `/${business.slug}`,
    imageUrl: business.imageUrl || business.logoUrl,
    reviewCount: business.reviewCount ?? business.reviews
  };
}

function FeaturedBusinessCard({ business, index, isDuplicate = false }) {
  const { t } = useTranslation("public");
  const [imageFailed, setImageFailed] = useState(false);
  const actionLabel = business.acceptingBookings
    ? t("featuredBusinesses.bookNow")
    : t("featuredBusinesses.viewBusiness");
  const hasImage = business.imageUrl && !imageFailed;

  return (
    <Link
      aria-label={t("featuredBusinesses.viewDetails", { name: business.name })}
      className={cn(
        "business-showcase-card group/card",
        `business-showcase-card-${index % 6}`
      )}
      href={business.href}
      tabIndex={isDuplicate ? -1 : undefined}
    >
      {hasImage ? (
        <img
          alt={t("featuredBusinesses.coverAlt", { name: business.name })}
          className="h-full w-full object-cover transition duration-700 group-hover/card:scale-[1.045]"
          draggable={false}
          onError={() => setImageFailed(true)}
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
  const providedBusinesses = Array.isArray(businesses) ? businesses : [];
  const preferredBusinesses =
    providedBusinesses.length > 0 ? providedBusinesses : landingShowcaseBusinesses;
  const normalizedBusinesses = preferredBusinesses
    .map(normalizeBusiness)
    .filter((business) => business.name && business.slug)
    .slice(0, 8);
  const visibleBusinesses =
    normalizedBusinesses.length > 0
      ? normalizedBusinesses
      : landingShowcaseBusinesses.map(normalizeBusiness).slice(0, 8);
  const reverseBusinesses = [...visibleBusinesses].reverse();

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
