import {
  buildReviewAccess,
  getRequestedBusinessId,
  requireReviewContext,
  reviewSelect
} from "@/features/reviews/server";
import { buildReviewSummary } from "@/features/reviews/summary";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const REVIEW_STATUSES = ["ALL", "PENDING", "PUBLISHED", "HIDDEN"];

export async function GET(request) {
  try {
    const { user, business } = await requireReviewContext(
      getRequestedBusinessId(request)
    );
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim();
    const rating = searchParams.get("rating") || "ALL";
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(
      searchParams.get("pageSize") || DEFAULT_PAGE_SIZE
    );

    if (!REVIEW_STATUSES.includes(status)) {
      return fail("Choose a valid review status.", 422);
    }

    if (
      rating !== "ALL" &&
      (!Number.isInteger(Number(rating)) ||
        Number(rating) < 1 ||
        Number(rating) > 5)
    ) {
      return fail("Choose a valid review rating.", 422);
    }

    if (search && search.length > 100) {
      return fail("Search must be 100 characters or fewer.", 422);
    }

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_PAGE_SIZE
    ) {
      return fail("Choose valid review pagination values.", 422);
    }

    const reviewWhere = {
      businessId: business.id,
      ...(status !== "ALL" ? { status } : {}),
      ...(rating !== "ALL" ? { rating: Number(rating) } : {}),
      ...(search
        ? {
            OR: [
              {
                customerNameSnapshot: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                serviceNameSnapshot: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                title: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                comment: {
                  contains: search,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {})
    };
    const [reviews, summary] = await Promise.all([
      prisma.review.findMany({
        where: reviewWhere,
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: reviewSelect
      }),
      buildReviewSummary({
        businessId: business.id,
        filteredWhere: reviewWhere
      })
    ]);
    const totalPages = Math.max(
      Math.ceil(summary.filteredTotal / pageSize),
      1
    );

    return ok({
      reviews,
      summary,
      access: buildReviewAccess(user, business),
      pagination: {
        page,
        pageSize,
        totalItems: summary.filteredTotal,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
