import { getCustomerBookingContext } from "@/features/customer-portal/server";
import {
  customerReviewStateResponse,
  submitCustomerBookingReview
} from "@/features/reviews/customer-submission";
import { reviewSubmissionSchema } from "@/features/reviews/validation/review-schema";
import { fail } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

const customerPortalReviewSchema = reviewSubmissionSchema.omit(["token"]);

export async function GET(_request, { params }) {
  try {
    const { bookingId } = await params;
    const { booking } = await getCustomerBookingContext({
      bookingId
    });

    return customerReviewStateResponse(booking);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const { bookingId } = await params;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerPortalReviewSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the review.", 422, errors);
    }

    const { booking, business } = await getCustomerBookingContext({
      bookingId
    });

    return submitCustomerBookingReview({
      business,
      booking,
      data
    });
  } catch (error) {
    return handleApiError(error);
  }
}
