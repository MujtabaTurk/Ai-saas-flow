import { getBookingCreationAccess } from "@/features/bookings/access";
import { getBookingSettings } from "@/features/bookings/lifecycle";
import { getBusinessForBooking } from "@/features/bookings/server";
import {
  getPublicReviewSummary,
  mapPublicReview,
  publicReviewSelect
} from "@/features/reviews/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { businessSlug } = await params;
    const business = await getBusinessForBooking({
      slug: businessSlug
    });
    const access = await getBookingCreationAccess({ business });
    const [services, reviews, reviewSummary] = await Promise.all([
      prisma.service.findMany({
        where: {
          businessId: business.id,
          isActive: true
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
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

    return ok({
      business: {
        slug: business.slug,
        name: business.name,
        description: business.description,
        logoUrl: business.logoUrl,
        status: business.status,
        timezone: business.timezone,
        currency: business.currency,
        locale: business.locale,
        acceptingBookings:
          access.canCreate &&
          getBookingSettings(business.settings).allowGuestBookings
      },
      settings: getBookingSettings(business.settings),
      services,
      reviews: reviews.map(mapPublicReview),
      reviewSummary
    });
  } catch (error) {
    return handleApiError(error);
  }
}
