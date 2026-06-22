import {
  assertBusinessAccess,
  assertBusinessWriteAccess
} from "@/features/auth/permissions";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const serviceBusinessSelect = {
  id: true,
  status: true,
  currency: true,
  subscriptions: {
    orderBy: {
      createdAt: "desc"
    },
    take: 1,
    select: {
      planCode: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      trialEndsAt: true
    }
  }
};

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function requireServiceBusiness(user, requestedBusinessId = null) {
  const businessId = requestedBusinessId || user?.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before managing services.",
      409
    );
  }

  if (!isValidMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBusinessAccess(user, businessId);

  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: serviceBusinessSelect
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  return business;
}

export function assertServiceWriteAccess(user, business) {
  assertBusinessWriteAccess(user, business);
}

export async function findTenantService({
  businessId,
  serviceId,
  select
}) {
  if (!isValidMongoObjectId(serviceId)) {
    return null;
  }

  return prisma.service.findFirst({
    where: {
      id: serviceId,
      businessId,
      type: "BOOKING"
    },
    select
  });
}
