import { notifyReviewSubmitted } from "@/features/notifications/events";
import { created, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export const customerReviewSelect = {
  id: true,
  rating: true,
  title: true,
  comment: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

export function getCustomerReviewState(booking, now = new Date()) {
  return {
    review: booking.review,
    canReview:
      booking.status === "COMPLETED" &&
      booking.endsAt <= now &&
      !booking.review
  };
}

export function customerReviewStateResponse(booking) {
  return ok(getCustomerReviewState(booking));
}

export async function submitCustomerBookingReview({
  business,
  booking,
  data
}) {
  if (business.status === "ARCHIVED") {
    throw new AppError("Reviews are unavailable for this business.", 403);
  }

  if (booking.status !== "COMPLETED" || booking.endsAt > new Date()) {
    throw new AppError(
      "A review can only be submitted after the booking is completed.",
      409
    );
  }

  if (booking.review) {
    throw new AppError(
      "A review has already been submitted for this booking.",
      409
    );
  }

  try {
    const review = await prisma.review.create({
      data: {
        businessId: booking.businessId,
        bookingId: booking.id,
        customerId: booking.customerId,
        serviceId: booking.serviceId,
        rating: data.rating,
        title: data.title?.trim() || null,
        comment: data.comment.trim(),
        customerNameSnapshot: booking.customerName,
        serviceNameSnapshot: booking.serviceNameSnapshot
      },
      select: customerReviewSelect
    });

    try {
      await notifyReviewSubmitted({
        business,
        booking,
        review
      });
    } catch (notificationError) {
      console.error(
        "Could not queue review-submitted notifications.",
        notificationError
      );
    }

    return created({
      review,
      message:
        "Thank you. Your review was submitted and is awaiting moderation."
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new AppError(
        "A review has already been submitted for this booking.",
        409
      );
    }

    throw error;
  }
}
