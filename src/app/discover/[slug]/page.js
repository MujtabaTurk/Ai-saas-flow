/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Clock3,
  MapPin,
  Star
} from "lucide-react";
import { getDemoBusinessBySlug } from "@/features/discovery/demo-businesses";

export const metadata = {
  title: "Business Details | ServiceFlow Discover",
  description:
    "Preview a service business profile with category, rating, location, services, and booking actions."
};

function DetailRow({ label, value }) {
  return (
    <div className="border-t border-[#d8dff0] pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#586377]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#0b1c30]">{value}</p>
    </div>
  );
}

export default async function DiscoverBusinessDetailPage({ params }) {
  const { slug } = await params;
  const business = getDemoBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0b1c30]">
      <section className="bg-white px-6 py-8">
        <div className="mx-auto max-w-[1280px]">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3525cd] hover:underline"
            href="/discover"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Discover
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#3525cd]">
                  {business.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                  <Star className="size-3.5 fill-current" aria-hidden="true" />
                  {business.rating} ({business.reviews} reviews)
                </span>
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
                {business.name}
              </h1>
              <p className="mt-4 max-w-[760px] text-base leading-7 text-[#464555]">
                {business.description}
              </p>
              <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#464555]">
                <MapPin className="size-4 text-[#3525cd]" aria-hidden="true" />
                {business.address}
              </p>
            </div>
            <div className="overflow-hidden rounded-[8px] bg-[#dfe7f6]">
              <img
                alt={`${business.name} cover`}
                className="aspect-[16/11] h-full w-full object-cover"
                src={business.imageUrl}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-10">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#3525cd]">
                Services
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#0b1c30]">
                Popular services
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {business.services.map((service, index) => (
                  <article
                    className="rounded-[8px] border border-[#d8dff0] bg-white p-5"
                    key={service}
                  >
                    <CalendarCheck className="size-5 text-[#3525cd]" aria-hidden="true" />
                    <h3 className="mt-4 font-bold text-[#0b1c30]">{service}</h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[#586377]">
                      <Clock3 className="size-4" aria-hidden="true" />
                      {index === 0 ? "45 min" : index === 1 ? "60 min" : "30 min"}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#3525cd]">
                About
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#0b1c30]">
                Why customers choose this business
              </h2>
              <p className="mt-4 max-w-[760px] text-base leading-7 text-[#464555]">
                {business.serviceFocus}. ServiceFlow presents the business with
                the trust signals customers need: clear services, ratings,
                location context, and a direct booking path.
              </p>
            </section>
          </div>

          <aside className="h-fit rounded-[8px] border border-[#d8dff0] bg-white p-6 lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#3525cd]">
              Booking Preview
            </p>
            <h2 className="mt-3 text-2xl font-bold text-[#0b1c30]">
              {business.price}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#586377]">
              Compare services and continue into a ServiceFlow booking setup.
            </p>
            <div className="mt-6 grid gap-4">
              <DetailRow label="Category" value={business.category} />
              <DetailRow label="Location" value={business.location} />
              <DetailRow label="Rating" value={`${business.rating}/5`} />
            </div>
            <Link
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-[8px] bg-[#3525cd] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2f22b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/35"
              href="/register"
            >
              Request Booking
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
