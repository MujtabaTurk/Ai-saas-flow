import {
  assertReviewWriteAccess,
  findTenantReview,
  getRequestedBusinessId,
  requireReviewContext,
  reviewSelect
} from "@/features/reviews/server";
import { reviewModerationSchema } from "@/features/reviews/validation/review-schema";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { user, business } = await requireReviewContext(
      getRequestedBusinessId(request)
    );
    assertReviewWriteAccess(user, business);
    const { reviewId } = await params;
    const review = await findTenantReview({
      businessId: business.id,
      reviewId
    });

    if (!review) {
      return fail("Review not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      reviewModerationSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the moderation action.", 422, errors);
    }

    if (review.status === data.status) {
      return ok({
        review,
        message: `Review is already ${data.status.toLowerCase()}.`
      });
    }

    const now = new Date();
    const updatedReview = await prisma.$transaction(async (transaction) => {
      const result = await transaction.review.updateMany({
        where: {
          id: review.id,
          businessId: business.id,
          status: review.status
        },
        data: {
          status: data.status,
          publishedAt: data.status === "PUBLISHED" ? now : null,
          moderatedAt: now,
          moderatedByUserId: user.id
        }
      });

      if (result.count === 0) {
        throw new AppError(
          "This review changed while it was being moderated. Refresh and try again.",
          409
        );
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: "REVIEW_STATUS_CHANGED",
          targetType: "REVIEW",
          targetId: review.id,
          reason: data.reason || null,
          metadata: {
            previousStatus: review.status,
            status: data.status,
            rating: review.rating,
            bookingId: review.bookingId,
            customerId: review.customerId,
            serviceId: review.serviceId
          }
        }
      });

      return transaction.review.findFirst({
        where: {
          id: review.id,
          businessId: business.id
        },
        select: reviewSelect
      });
    });

    return ok({
      review: updatedReview,
      message:
        data.status === "PUBLISHED"
          ? "Review published."
          : "Review hidden from the public booking page."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
