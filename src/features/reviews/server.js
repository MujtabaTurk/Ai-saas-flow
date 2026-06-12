import {
  assertBusinessManagement,
  assertBusinessWriteAccess,
  isSuperAdmin
} from "@/features/auth/permissions";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const reviewSelect = {
  id: true,
  businessId: true,
  bookingId: true,
  customerId: true,
  serviceId: true,
  rating: true,
  title: true,
  comment: true,
  customerNameSnapshot: true,
  serviceNameSnapshot: true,
  status: true,
  publishedAt: true,
  moderatedAt: true,
  createdAt: true,
  updatedAt: true,
  booking: {
    select: {
      bookingNumber: true,
      startsAt: true,
      timezone: true
    }
  },
  customer: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  service: {
    select: {
      id: true,
      name: true
    }
  },
  moderatedBy: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
};

export const publicReviewSelect = {
  id: true,
  rating: true,
  title: true,
  comment: true,
  customerNameSnapshot: true,
  serviceNameSnapshot: true,
  publishedAt: true,
  createdAt: true
};

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function requireReviewContext(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before managing reviews.",
      409
    );
  }

  if (!isValidMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBusinessManagement(user, businessId);
  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      timezone: true
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  return {
    user,
    business
  };
}

export function buildReviewAccess(user, business) {
  const isReadOnly = business.status !== "ACTIVE" && !isSuperAdmin(user);

  return {
    businessStatus: business.status,
    isReadOnly,
    canModerate: !isReadOnly
  };
}

export function assertReviewWriteAccess(user, business) {
  assertBusinessWriteAccess(user, business);
}

export async function findTenantReview({
  businessId,
  reviewId,
  select = reviewSelect
}) {
  if (!isValidMongoObjectId(reviewId)) {
    return null;
  }

  return prisma.review.findFirst({
    where: {
      id: reviewId,
      businessId
    },
    select
  });
}

export function maskReviewerName(name) {
  const parts = String(name || "Customer")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) {
    return parts[0] || "Customer";
  }

  return `${parts[0]} ${parts.at(-1).charAt(0).toUpperCase()}.`;
}

export function mapPublicReview(review) {
  return {
    ...review,
    customerName: maskReviewerName(review.customerNameSnapshot),
    customerNameSnapshot: undefined
  };
}

export async function getPublicReviewSummary(businessId) {
  const aggregate = await prisma.review.aggregate({
    where: {
      businessId,
      status: "PUBLISHED"
    },
    _count: {
      _all: true
    },
    _avg: {
      rating: true
    }
  });

  return {
    total: aggregate._count._all,
    averageRating:
      aggregate._avg.rating === null
        ? null
        : Math.round(aggregate._avg.rating * 10) / 10
  };
}
