import { prisma } from "@/lib/prisma";

export async function buildReviewSummary({
  businessId,
  filteredWhere
}) {
  const [filteredTotal, total, pending, published, hidden, aggregate] =
    await Promise.all([
      prisma.review.count({
        where: filteredWhere
      }),
      prisma.review.count({
        where: {
          businessId
        }
      }),
      prisma.review.count({
        where: {
          businessId,
          status: "PENDING"
        }
      }),
      prisma.review.count({
        where: {
          businessId,
          status: "PUBLISHED"
        }
      }),
      prisma.review.count({
        where: {
          businessId,
          status: "HIDDEN"
        }
      }),
      prisma.review.aggregate({
        where: {
          businessId,
          status: "PUBLISHED"
        },
        _avg: {
          rating: true
        }
      })
    ]);

  return {
    filteredTotal,
    total,
    pending,
    published,
    hidden,
    averagePublishedRating:
      aggregate._avg.rating === null
        ? null
        : Math.round(aggregate._avg.rating * 10) / 10
  };
}
