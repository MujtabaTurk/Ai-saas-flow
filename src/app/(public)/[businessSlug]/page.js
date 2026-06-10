import { Clock3, Mail, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicBookingForm } from "@/features/bookings/components/public-booking-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Book an appointment | ServiceFlow"
};

function formatPrice(service) {
  if (service.priceCents === null || service.priceCents === undefined) {
    return "Free";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: service.currency
  }).format(service.priceCents / 100);
}

export default async function PublicBusinessPage({ params }) {
  const { businessSlug } = await params;
  const business = await prisma.business.findUnique({
    where: {
      slug: businessSlug
    },
    select: {
      name: true,
      slug: true,
      description: true,
      email: true,
      phone: true,
      timezone: true,
      status: true,
      services: {
        where: {
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
      }
    }
  });

  if (!business) {
    notFound();
  }

  const acceptingBookings =
    business.status === "ACTIVE" && business.services.length > 0;

  return (
    <main className="min-h-screen bg-growth-dashboard px-4 py-10 text-growth-sidebar sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-6">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-growth-mint/50 px-3 py-1 text-sm font-semibold text-growth-dark">
              Online booking
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
              Times shown in {business.timezone}
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
            <h2 className="text-lg font-bold">Services</h2>
            {business.services.map((service) => (
              <article
                className="rounded-2xl border border-growth-border bg-white p-5 shadow-sm"
                key={service.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{service.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {service.durationMin} minutes
                    </p>
                  </div>
                  <p className="font-bold text-primary">{formatPrice(service)}</p>
                </div>
                {service.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {service.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section>
          {acceptingBookings ? (
            <PublicBookingForm
              business={{
                name: business.name,
                slug: business.slug,
                timezone: business.timezone
              }}
              services={business.services}
            />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold">Booking is unavailable</h2>
              <p className="mt-2 text-muted-foreground">
                This business is not accepting new online bookings right now.
                Existing appointments remain available through their confirmation link.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
