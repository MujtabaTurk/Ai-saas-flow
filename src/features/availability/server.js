import {
  assertBusinessManagement,
  assertBusinessWriteAccess,
  isSuperAdmin
} from "@/features/auth/permissions";
import { isSubscriptionEntitled } from "@/features/billing/status";
import { exactServiceScopeWhere } from "@/features/availability/service-scope";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const availabilitySelect = {
  id: true,
  businessId: true,
  serviceId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  slotDurationMin: true,
  bufferBeforeMin: true,
  bufferAfterMin: true,
  isActive: true,
  service: {
    select: {
      id: true,
      name: true
    }
  },
  createdAt: true,
  updatedAt: true
};

export const unavailableDateSelect = {
  id: true,
  businessId: true,
  serviceId: true,
  startsAt: true,
  endsAt: true,
  reason: true,
  isFullDay: true,
  service: {
    select: {
      id: true,
      name: true
    }
  },
  createdAt: true,
  updatedAt: true
};

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function requireAvailabilityContext(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before managing availability.",
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
      status: true,
      timezone: true,
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

export function assertAvailabilityWriteAccess(user, business) {
  assertBusinessWriteAccess(user, business);
}

export function assertAvailabilityEntitlement(user, business) {
  if (
    !isSuperAdmin(user) &&
    !isSubscriptionEntitled(business?.subscriptions?.[0])
  ) {
    throw new AppError(
      "An active subscription is required before configuring availability.",
      402
    );
  }
}

export async function assertServiceBelongsToBusiness(serviceId, businessId) {
  if (!serviceId) {
    return;
  }

  if (!isValidMongoObjectId(serviceId)) {
    throw new NotFoundError("Service not found for this business.");
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      businessId
    },
    select: {
      id: true
    }
  });

  if (!service) {
    throw new NotFoundError("Service not found for this business.");
  }
}

export async function findTenantAvailability({
  businessId,
  availabilityId,
  select = availabilitySelect
}) {
  if (!isValidMongoObjectId(availabilityId)) {
    return null;
  }

  return prisma.availability.findFirst({
    where: {
      id: availabilityId,
      businessId
    },
    select
  });
}

export async function findTenantUnavailableDate({
  businessId,
  unavailableDateId,
  select = unavailableDateSelect
}) {
  if (!isValidMongoObjectId(unavailableDateId)) {
    return null;
  }

  return prisma.unavailableDate.findFirst({
    where: {
      id: unavailableDateId,
      businessId
    },
    select
  });
}

export function normalizeAvailabilityInput(data) {
  return {
    serviceId: data.serviceId || null,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    slotDurationMin: Number(data.slotDurationMin),
    bufferBeforeMin: Number(data.bufferBeforeMin || 0),
    bufferAfterMin: Number(data.bufferAfterMin || 0)
  };
}

export async function assertNoAvailabilityOverlap({
  businessId,
  availabilityId,
  input,
  isActive = true
}) {
  if (!isActive) {
    return;
  }

  const windows = await prisma.availability.findMany({
    where: {
      businessId,
      dayOfWeek: input.dayOfWeek,
      isActive: true,
      ...exactServiceScopeWhere(input.serviceId),
      ...(availabilityId
        ? {
            id: {
              not: availabilityId
            }
          }
        : {})
    },
    select: {
      startTime: true,
      endTime: true
    }
  });

  const overlaps = windows.some(
    (window) => window.startTime < input.endTime && window.endTime > input.startTime
  );

  if (overlaps) {
    throw new AppError("This working-hours range overlaps another range for the same day and service.", 409, {
      startTime: "Choose a non-overlapping time range.",
      endTime: "Choose a non-overlapping time range."
    });
  }
}

export async function assertNoUnavailableDateOverlap({
  businessId,
  unavailableDateId,
  serviceId,
  startsAt,
  endsAt
}) {
  const overlap = await prisma.unavailableDate.findFirst({
    where: {
      businessId,
      ...exactServiceScopeWhere(serviceId),
      startsAt: {
        lt: endsAt
      },
      endsAt: {
        gt: startsAt
      },
      ...(unavailableDateId
        ? {
            id: {
              not: unavailableDateId
            }
          }
        : {})
    },
    select: {
      id: true
    }
  });

  if (overlap) {
    throw new AppError("This unavailable period overlaps another exception for the same scope.", 409, {
      date: "Choose a non-overlapping date or time."
    });
  }
}
