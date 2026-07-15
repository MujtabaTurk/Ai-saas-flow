import { hashToken } from "@/features/auth/password";
import {
  assertBusinessAccess,
  canManageBusiness,
  isBusinessStaff
} from "@/features/auth/permissions";
import { formatDateTimeInTimezone } from "@/features/availability/time";
import { createCustomerAccessToken } from "@/features/bookings/access-token";
import {
  assertBookingCreationAllowed,
  getBookingCreationAccess
} from "@/features/bookings/access";
import { createBookingNumber } from "@/features/bookings/booking-number";
import { isSameLocalCalendarDay } from "@/features/bookings/date";
import { getBookingSettings } from "@/features/bookings/lifecycle";
import { createOccupancyBuckets } from "@/features/bookings/occupancy";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import {
  attachCustomerProfileToVerifiedAccount,
  buildVerifiedCustomerLinkDataForEmail
} from "@/features/customers/claiming";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const bookingListSelect = {
  id: true,
  businessId: true,
  serviceId: true,
  customerId: true,
  assignedMemberId: true,
  bookingNumber: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  serviceNameSnapshot: true,
  serviceDurationMinSnapshot: true,
  servicePriceCentsSnapshot: true,
  serviceCurrencySnapshot: true,
  paymentRequiredSnapshot: true,
  payment: {
    select: {
      id: true,
      method: true,
      status: true,
      amountCents: true,
      currency: true,
      paidAt: true,
      failedAt: true,
      audits: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          action: true,
          paymentStatus: true,
          paymentMethod: true,
          notes: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true } }
        }
      }
    }
  },
  startsAt: true,
  endsAt: true,
  timezone: true,
  status: true,
  source: true,
  notes: true,
  internalNotes: true,
  cancellationReason: true,
  canceledAt: true,
  confirmedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  assignedMember: {
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  }
};

export const bookingSelect = {
  ...bookingListSelect,
  service: {
    select: {
      id: true,
      name: true,
      isActive: true
    }
  },
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  }
};

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function getBusinessForBooking(businessLocator) {
  if (
    businessLocator.id &&
    !isValidMongoObjectId(businessLocator.id)
  ) {
    throw new NotFoundError("Business not found.");
  }

  const where = businessLocator.id
    ? { id: businessLocator.id }
    : { slug: businessLocator.slug };

  const business = await prisma.business.findUnique({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      industry: true,
      logoUrl: true,
      email: true,
      phone: true,
      status: true,
      timezone: true,
      currency: true,
      locale: true,
      settings: true,
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

  return business;
}

export async function requireBookingContext(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before managing bookings.",
      409
    );
  }

  if (!isValidMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBusinessAccess(user, businessId);

  if (isBusinessStaff(user) && !user.activeBusinessMembershipId) {
    throw new AppError("An active team membership is required.", 403);
  }

  return {
    user,
    business: await getBusinessForBooking({
      id: businessId
    })
  };
}

export function assertBookingOperationalAccess(user, booking) {
  if (canManageBusiness(user, booking.businessId)) {
    return;
  }

  if (
    isBusinessStaff(user) &&
    user.activeBusinessMembershipId &&
    booking.assignedMemberId === user.activeBusinessMembershipId
  ) {
    return;
  }

  throw new AppError(
    "You can only manage bookings assigned to your team membership.",
    403
  );
}

export async function findTenantBooking({
  businessId,
  bookingId,
  select = bookingSelect
}) {
  if (!isValidMongoObjectId(bookingId)) {
    return null;
  }

  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      businessId
    },
    select
  });
}

export async function createBooking({
  business,
  input,
  source,
  createdByUserId = null
}) {
  const existingBooking = await prisma.booking.findUnique({
    where: {
      businessId_idempotencyKey: {
        businessId: business.id,
        idempotencyKey: input.idempotencyKey
      }
    },
    select: bookingSelect
  });
  const customerAccessToken = createCustomerAccessToken(business.id, input.idempotencyKey);

  if (existingBooking) {
    return {
      booking: existingBooking,
      customerAccessToken,
      idempotentReplay: true
    };
  }

  const settings = getBookingSettings(business.settings);

  if (source === "PUBLIC" && !settings.allowGuestBookings) {
    throw new AppError("Guest bookings are disabled for this business.", 403);
  }

  const creationAccess = await getBookingCreationAccess({ business });
  assertBookingCreationAllowed(creationAccess);

  const service = await prisma.service.findFirst({
    where: {
      id: input.serviceId,
      businessId: business.id,
      type: "BOOKING",
      isActive: true
    },
    select: {
      id: true,
      name: true,
      durationMin: true,
      bufferBeforeMin: true,
      bufferAfterMin: true,
      priceCents: true,
      currency: true,
      requiresPayment: true,
      isActive: true
    }
  });

  if (!service) {
    throw new NotFoundError("Active service not found.");
  }

  const requestedStart = new Date(input.startsAt);

  if (Number.isNaN(requestedStart.getTime())) {
    throw new AppError("Choose a valid booking time.", 422);
  }

  const dateValue = formatDateTimeInTimezone(requestedStart, business.timezone).date;
  const slots = await getAvailableSlotsForBusiness({
    business,
    service,
    dateValue
  });
  const selectedSlot = slots.find((slot) => slot.startsAt === requestedStart.toISOString());

  if (!selectedSlot) {
    throw new AppError("This time is no longer available. Choose another slot.", 409);
  }

  const startsAt = new Date(selectedSlot.startsAt);
  const endsAt = new Date(selectedSlot.endsAt);

  if (!isSameLocalCalendarDay(startsAt, endsAt, business.timezone)) {
    throw new AppError("Appointments cannot cross midnight.", 422);
  }

  const occupiedStart = new Date(startsAt.getTime() - selectedSlot.bufferBeforeMin * 60 * 1000);
  const occupiedEnd = new Date(endsAt.getTime() + selectedSlot.bufferAfterMin * 60 * 1000);
  const occupancyBuckets = createOccupancyBuckets(occupiedStart, occupiedEnd);
  const email = normalizeEmail(input.customerEmail);
  const verifiedCustomerLinkData =
    await buildVerifiedCustomerLinkDataForEmail(email);
  const customer = await prisma.customer.upsert({
    where: {
      businessId_email: {
        businessId: business.id,
        email
      }
    },
    create: {
      businessId: business.id,
      name: input.customerName.trim(),
      email,
      phone: input.customerPhone?.trim() || null,
      timezone: business.timezone,
      locale: business.locale,
      ...verifiedCustomerLinkData
    },
    update: {
      name: input.customerName.trim(),
      phone: input.customerPhone?.trim() || undefined
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (
    verifiedCustomerLinkData.userId &&
    customer.userId !== verifiedCustomerLinkData.userId
  ) {
    await attachCustomerProfileToVerifiedAccount({
      customerId: customer.id,
      email
    });
  }

  const status =
    settings.autoConfirmBookings && !service.requiresPayment
      ? "CONFIRMED"
      : "PENDING";
  const now = new Date();

  try {
    const booking = await prisma.booking.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        customerId: customer.id,
        createdByUserId,
        bookingNumber: createBookingNumber(),
        idempotencyKey: input.idempotencyKey,
        customerAccessTokenHash: hashToken(customerAccessToken),
        customerName: input.customerName.trim(),
        customerEmail: email,
        customerPhone: input.customerPhone?.trim() || null,
        serviceNameSnapshot: service.name,
        serviceDurationMinSnapshot: service.durationMin,
        servicePriceCentsSnapshot: service.priceCents,
        serviceCurrencySnapshot: service.currency,
        bufferBeforeMinSnapshot: selectedSlot.bufferBeforeMin,
        bufferAfterMinSnapshot: selectedSlot.bufferAfterMin,
        paymentRequiredSnapshot: service.requiresPayment,
        startsAt,
        endsAt,
        timezone: business.timezone,
        status,
        source,
        notes: input.notes?.trim() || null,
        confirmedAt: status === "CONFIRMED" ? now : null,
        occupancies: {
          create: occupancyBuckets.map((bucketStart) => ({
            resourceKey: "BUSINESS",
            bucketStart,
            business: {
              connect: {
                id: business.id
              }
            }
          }))
        }
      },
      select: bookingSelect
    });

    return {
      booking,
      customerAccessToken,
      idempotentReplay: false
    };
  } catch (error) {
    if (error?.code === "P2002") {
      const replayedBooking = await prisma.booking.findUnique({
        where: {
          businessId_idempotencyKey: {
            businessId: business.id,
            idempotencyKey: input.idempotencyKey
          }
        },
        select: bookingSelect
      });

      if (replayedBooking) {
        return {
          booking: replayedBooking,
          customerAccessToken,
          idempotentReplay: true
        };
      }

      throw new AppError("This time was just booked by another customer. Choose another slot.", 409);
    }

    throw error;
  }
}
