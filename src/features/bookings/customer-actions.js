import { formatDateTimeInTimezone } from "@/features/availability/time";
import { isSameLocalCalendarDay } from "@/features/bookings/date";
import {
  canCustomerCancelBooking,
  getBookingSettings
} from "@/features/bookings/lifecycle";
import { createOccupancyBuckets } from "@/features/bookings/occupancy";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import { notifyCustomerCanceledBooking } from "@/features/notifications/events";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function cancelCustomerBooking({
  booking,
  business,
  reason = null,
  select
}) {
  const settings = getBookingSettings(business.settings);

  if (!canCustomerCancelBooking(booking, settings)) {
    throw new AppError(
      "The cancellation deadline has passed or this booking cannot be canceled.",
      409
    );
  }

  const now = new Date();
  const latestCancelableStart = new Date(
    now.getTime() + settings.cancellationWindowMin * 60 * 1000
  );
  const updatedBooking = await prisma.$transaction(async (transaction) => {
    const result = await transaction.booking.updateMany({
      where: {
        id: booking.id,
        businessId: business.id,
        status: booking.status,
        startsAt: {
          gt: latestCancelableStart
        }
      },
      data: {
        status: "CANCELED",
        canceledAt: now,
        cancellationReason: reason || "Canceled by customer"
      }
    });

    if (result.count === 0) {
      throw new AppError(
        "This booking changed while it was being canceled. Refresh and try again.",
        409
      );
    }

    await transaction.bookingOccupancy.deleteMany({
      where: {
        bookingId: booking.id,
        businessId: business.id
      }
    });

    return transaction.booking.findFirst({
      where: {
        id: booking.id,
        businessId: business.id
      },
      select
    });
  });

  try {
    await notifyCustomerCanceledBooking({
      booking: updatedBooking
    });
  } catch (notificationError) {
    console.error(
      "Could not queue booking-cancellation notifications.",
      notificationError
    );
  }

  return updatedBooking;
}

export async function rescheduleCustomerBooking({
  booking,
  business,
  startsAt,
  select
}) {
  const settings = getBookingSettings(business.settings);

  if (!canCustomerCancelBooking(booking, settings)) {
    throw new AppError(
      "The reschedule deadline has passed or this booking cannot be rescheduled.",
      409
    );
  }

  const requestedStart = new Date(startsAt);

  if (Number.isNaN(requestedStart.getTime())) {
    throw new AppError("Choose a valid booking time.", 422);
  }

  if (requestedStart.getTime() === booking.startsAt.getTime()) {
    return booking;
  }

  const service = await prisma.service.findFirst({
    where: {
      id: booking.serviceId,
      businessId: business.id,
      type: "BOOKING",
      isActive: true
    },
    select: {
      id: true,
      durationMin: true,
      bufferBeforeMin: true,
      bufferAfterMin: true,
      isActive: true
    }
  });

  if (!service) {
    throw new NotFoundError("Active service not found.");
  }

  const dateValue = formatDateTimeInTimezone(
    requestedStart,
    business.timezone
  ).date;
  const slots = await getAvailableSlotsForBusiness({
    business,
    service,
    dateValue
  });
  const selectedSlot = slots.find(
    (slot) => slot.startsAt === requestedStart.toISOString()
  );

  if (!selectedSlot) {
    throw new AppError(
      "This time is no longer available. Choose another slot.",
      409
    );
  }

  const nextStartsAt = new Date(selectedSlot.startsAt);
  const nextEndsAt = new Date(selectedSlot.endsAt);

  if (!isSameLocalCalendarDay(nextStartsAt, nextEndsAt, business.timezone)) {
    throw new AppError("Appointments cannot cross midnight.", 422);
  }

  const occupiedStart = new Date(
    nextStartsAt.getTime() - selectedSlot.bufferBeforeMin * 60 * 1000
  );
  const occupiedEnd = new Date(
    nextEndsAt.getTime() + selectedSlot.bufferAfterMin * 60 * 1000
  );
  const occupancyBuckets = createOccupancyBuckets(occupiedStart, occupiedEnd);

  try {
    return await prisma.$transaction(async (transaction) => {
      const result = await transaction.booking.updateMany({
        where: {
          id: booking.id,
          businessId: business.id,
          status: booking.status,
          startsAt: booking.startsAt
        },
        data: {
          startsAt: nextStartsAt,
          endsAt: nextEndsAt,
          timezone: business.timezone,
          bufferBeforeMinSnapshot: selectedSlot.bufferBeforeMin,
          bufferAfterMinSnapshot: selectedSlot.bufferAfterMin
        }
      });

      if (result.count === 0) {
        throw new AppError(
          "This booking changed while it was being rescheduled. Refresh and try again.",
          409
        );
      }

      await transaction.bookingOccupancy.deleteMany({
        where: {
          bookingId: booking.id,
          businessId: business.id
        }
      });

      await transaction.bookingOccupancy.createMany({
        data: occupancyBuckets.map((bucketStart) => ({
          businessId: business.id,
          bookingId: booking.id,
          resourceKey: "BUSINESS",
          bucketStart
        }))
      });

      return transaction.booking.findFirst({
        where: {
          id: booking.id,
          businessId: business.id
        },
        select
      });
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new AppError(
        "This time was just booked by another customer. Choose another slot.",
        409
      );
    }

    throw error;
  }
}
