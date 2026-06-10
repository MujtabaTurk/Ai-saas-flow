import {
  assertBusinessManagement,
  assertBusinessWriteAccess
} from "@/features/auth/permissions";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
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

export async function requireAvailabilityContext() {
  const user = await requireCurrentUser();

  if (!user.activeBusinessId) {
    throw new AppError("Business onboarding is required before managing availability.", 409);
  }

  assertBusinessManagement(user, user.activeBusinessId);

  const business = await prisma.business.findUnique({
    where: {
      id: user.activeBusinessId
    },
    select: {
      id: true,
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

export function assertAvailabilityWriteAccess(user, business) {
  assertBusinessWriteAccess(user, business);
}

export async function assertServiceBelongsToBusiness(serviceId, businessId) {
  if (!serviceId) {
    return;
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
      serviceId: input.serviceId,
      isActive: true,
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
      serviceId,
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
