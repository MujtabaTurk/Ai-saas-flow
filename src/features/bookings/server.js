import { hashToken } from "@/features/auth/password";
import { formatDateTimeInTimezone } from "@/features/availability/time";
import { isSubscriptionEntitled } from "@/features/billing/status";
import { createCustomerAccessToken } from "@/features/bookings/access-token";
import { createBookingNumber } from "@/features/bookings/booking-number";
import { isSameLocalCalendarDay } from "@/features/bookings/date";
import { getBookingSettings } from "@/features/bookings/lifecycle";
import { createOccupancyBuckets } from "@/features/bookings/occupancy";
import { canCreateBookingForPlan, getBookingLimit } from "@/features/bookings/policy";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export const bookingSelect = {
  id: true,
  businessId: true,
  serviceId: true,
  customerId: true,
  bookingNumber: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  serviceNameSnapshot: true,
  serviceDurationMinSnapshot: true,
  servicePriceCentsSnapshot: true,
  serviceCurrencySnapshot: true,
  paymentRequiredSnapshot: true,
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

export async function getBusinessForBooking(businessLocator) {
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
      logoUrl: true,
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

async function assertBookingPlanAllowsCreation(business) {
  const subscription = business.subscriptions[0];
  const now = new Date();

  if (!isSubscriptionEntitled(subscription, now)) {
    throw new AppError("An active subscription is required before accepting bookings.", 402);
  }

  const entitlementEnd =
    subscription.currentPeriodEnd || subscription.trialEndsAt;

  const periodStart = subscription.currentPeriodStart || new Date(0);
  const periodEnd = entitlementEnd || new Date("9999-12-31");
  const bookingCount = await prisma.booking.count({
    where: {
      businessId: business.id,
      createdAt: {
        gte: periodStart,
        lt: periodEnd
      }
    }
  });

  if (!canCreateBookingForPlan(subscription.planCode, bookingCount)) {
    throw new AppError("This business has reached its booking limit for the current plan period.", 403, {
      limit: getBookingLimit(subscription.planCode)
    });
  }
}

export async function createBooking({
  business,
  input,
  source,
  createdByUserId = null
}) {
  if (business.status !== "ACTIVE") {
    throw new AppError("This business is not accepting new bookings.", 403);
  }

  const settings = getBookingSettings(business.settings);

  if (source === "PUBLIC" && !settings.allowGuestBookings) {
    throw new AppError("Guest bookings are disabled for this business.", 403);
  }

  await assertBookingPlanAllowsCreation(business);

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

  const service = await prisma.service.findFirst({
    where: {
      id: input.serviceId,
      businessId: business.id,
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
        customerId: (
          await prisma.customer.upsert({
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
              locale: business.locale
            },
            update: {
              name: input.customerName.trim(),
              phone: input.customerPhone?.trim() || undefined
            },
            select: {
              id: true
            }
          })
        ).id,
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
