import { verifyCustomerAccessToken } from "@/features/bookings/access-token";
import { getBusinessForBooking } from "@/features/bookings/server";
import {
  customerReviewSelect,
  customerReviewStateResponse,
  submitCustomerBookingReview
} from "@/features/reviews/customer-submission";
import { reviewSubmissionSchema } from "@/features/reviews/validation/review-schema";
import { fail } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getAuthorizedBooking({
  businessSlug,
  bookingNumber,
  token
}) {
  const business = await getBusinessForBooking({
    slug: businessSlug
  });
  const booking = await prisma.booking.findUnique({
    where: {
      businessId_bookingNumber: {
        businessId: business.id,
        bookingNumber
      }
    },
    select: {
      id: true,
      bookingNumber: true,
      businessId: true,
      serviceId: true,
      customerId: true,
      customerAccessTokenHash: true,
      customerName: true,
      customerEmail: true,
      serviceNameSnapshot: true,
      status: true,
      endsAt: true,
      timezone: true,
      review: {
        select: customerReviewSelect
      }
    }
  });

  if (
    !booking ||
    !verifyCustomerAccessToken(token, booking.customerAccessTokenHash)
  ) {
    return null;
  }

  return {
    business,
    booking
  };
}

export async function GET(request, { params }) {
  try {
    const { businessSlug, bookingNumber } = await params;
    const token = new URL(request.url).searchParams.get("token");
    const context = await getAuthorizedBooking({
      businessSlug,
      bookingNumber,
      token
    });

    if (!context) {
      return fail("Booking not found or access token is invalid.", 404);
    }

    const { booking } = context;

    return customerReviewStateResponse(booking);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const { businessSlug, bookingNumber } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      reviewSubmissionSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the review.", 422, errors);
    }

    const context = await getAuthorizedBooking({
      businessSlug,
      bookingNumber,
      token: data.token
    });

    if (!context) {
      return fail("Booking not found or access token is invalid.", 404);
    }

    const { business, booking } = context;

    return submitCustomerBookingReview({
      business,
      booking,
      data
    });
  } catch (error) {
    return handleApiError(error);
  }
}
