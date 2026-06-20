import {
  canCustomerCancelBooking,
  getBookingSettings,
  getCancellationDeadline
} from "@/features/bookings/lifecycle";
import { getBusinessForBooking } from "@/features/bookings/server";
import { CUSTOMER_ROLE } from "@/constants/roles";
import { claimCustomerProfilesForVerifiedUser } from "@/features/customers/claiming";
import { getCustomerReviewState } from "@/features/reviews/customer-submission";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"];
const TERMINAL_BOOKING_STATUSES = ["CANCELED", "COMPLETED", "NO_SHOW"];

export const customerPortalUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  phone: true,
  locale: true,
  timezone: true,
  platformRole: true,
  customerPortalEnabled: true,
  customerEmailNotifications: true,
  customerBookingReminders: true,
  customerMarketingOptIn: true,
  createdAt: true,
  updatedAt: true
};

export const customerPortalProfileSelect = {
  id: true,
  businessId: true,
  name: true,
  email: true,
  phone: true,
  locale: true,
  timezone: true,
  marketingOptIn: true,
  createdAt: true,
  updatedAt: true,
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      timezone: true,
      locale: true
    }
  }
};

export const customerPortalBookingSelect = {
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
  cancellationReason: true,
  canceledAt: true,
  confirmedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      email: true,
      phone: true,
      timezone: true
    }
  },
  review: {
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      status: true,
      createdAt: true
    }
  }
};

function getDisplayName(user, profiles) {
  return user.name || profiles[0]?.name || user.email || "Customer";
}

function mapBooking(booking) {
  return booking;
}

function buildActivityFromBooking(booking) {
  const statusLabel = booking.status.toLowerCase().replace("_", " ");
  const eventTime =
    booking.canceledAt ||
    booking.completedAt ||
    booking.confirmedAt ||
    booking.updatedAt ||
    booking.createdAt;

  return {
    id: `booking-${booking.id}`,
    type: "BOOKING",
    title: `Booking ${statusLabel}`,
    description: `${booking.serviceNameSnapshot} with ${booking.business.name}`,
    occurredAt: eventTime,
    href: "/customer/bookings",
    status: booking.status
  };
}

function buildActivityFromReview(review) {
  return {
    id: `review-${review.id}`,
    type: "REVIEW",
    title: "Review submitted",
    description: `${review.rating}-star review for ${review.serviceNameSnapshot}`,
    occurredAt: review.createdAt,
    href: "/customer/bookings",
    status: review.status
  };
}

async function enableCustomerPortalIfNeeded(user) {
  if (user.customerPortalEnabled) {
    return user;
  }

  return prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      customerPortalEnabled: true
    },
    select: customerPortalUserSelect
  });
}

export async function requireCustomerPortalAccount({
  enablePortal = true
} = {}) {
  const sessionUser = await requireCurrentUser();
  let user = await prisma.user.findUnique({
    where: {
      id: sessionUser.id
    },
    select: customerPortalUserSelect
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (enablePortal) {
    user = await enableCustomerPortalIfNeeded(user);
  }

  await claimCustomerProfilesForVerifiedUser(user);

  const profiles = await prisma.customer.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      updatedAt: "desc"
    },
    select: customerPortalProfileSelect
  });

  return {
    user: {
      ...user,
      customerRole:
        user.customerPortalEnabled || profiles.length > 0
          ? CUSTOMER_ROLE
          : null,
      displayName: getDisplayName(user, profiles)
    },
    profiles,
    customerIds: profiles.map((profile) => profile.id)
  };
}

export async function getCustomerDashboard() {
  const { user, profiles, customerIds } =
    await requireCustomerPortalAccount();
  const now = new Date();

  if (customerIds.length === 0) {
    return {
      user,
      profiles,
      stats: {
        total: 0,
        upcoming: 0,
        completed: 0,
        canceled: 0,
        noShow: 0,
        pending: 0,
        confirmed: 0
      },
      nextAppointment: null,
      upcomingBookings: [],
      pastBookings: [],
      recentActivity: []
    };
  }

  const baseWhere = {
    customerId: {
      in: customerIds
    }
  };
  const upcomingWhere = {
    ...baseWhere,
    status: {
      in: ACTIVE_BOOKING_STATUSES
    },
    startsAt: {
      gte: now
    }
  };
  const pastWhere = {
    ...baseWhere,
    OR: [
      {
        startsAt: {
          lt: now
        }
      },
      {
        status: {
          in: TERMINAL_BOOKING_STATUSES
        }
      }
    ]
  };

  const [
    total,
    upcoming,
    completed,
    canceled,
    noShow,
    pending,
    confirmed,
    nextAppointment,
    upcomingBookings,
    pastBookings,
    recentBookings,
    recentReviews
  ] = await Promise.all([
    prisma.booking.count({ where: baseWhere }),
    prisma.booking.count({ where: upcomingWhere }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: "COMPLETED"
      }
    }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: "CANCELED"
      }
    }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: "NO_SHOW"
      }
    }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: "PENDING"
      }
    }),
    prisma.booking.count({
      where: {
        ...baseWhere,
        status: "CONFIRMED"
      }
    }),
    prisma.booking.findFirst({
      where: upcomingWhere,
      orderBy: {
        startsAt: "asc"
      },
      select: customerPortalBookingSelect
    }),
    prisma.booking.findMany({
      where: upcomingWhere,
      orderBy: {
        startsAt: "asc"
      },
      take: 4,
      select: customerPortalBookingSelect
    }),
    prisma.booking.findMany({
      where: pastWhere,
      orderBy: {
        startsAt: "desc"
      },
      take: 4,
      select: customerPortalBookingSelect
    }),
    prisma.booking.findMany({
      where: baseWhere,
      orderBy: {
        updatedAt: "desc"
      },
      take: 6,
      select: customerPortalBookingSelect
    }),
    prisma.review.findMany({
      where: {
        customerId: {
          in: customerIds
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 4,
      select: {
        id: true,
        rating: true,
        status: true,
        serviceNameSnapshot: true,
        createdAt: true
      }
    })
  ]);

  const recentActivity = [
    ...recentBookings.map(buildActivityFromBooking),
    ...recentReviews.map(buildActivityFromReview)
  ]
    .sort((left, right) => (
      new Date(right.occurredAt).getTime() -
      new Date(left.occurredAt).getTime()
    ))
    .slice(0, 6);

  return {
    user,
    profiles,
    stats: {
      total,
      upcoming,
      completed,
      canceled,
      noShow,
      pending,
      confirmed
    },
    nextAppointment: nextAppointment ? mapBooking(nextAppointment) : null,
    upcomingBookings: upcomingBookings.map(mapBooking),
    pastBookings: pastBookings.map(mapBooking),
    recentActivity
  };
}

export async function getCustomerBookings({ scope = "all", status = "ALL" }) {
  const { user, profiles, customerIds } =
    await requireCustomerPortalAccount();
  const now = new Date();

  if (customerIds.length === 0) {
    return {
      user,
      profiles,
      bookings: [],
      summary: {
        total: 0,
        filteredTotal: 0
      }
    };
  }

  if (!["all", "upcoming", "past"].includes(scope)) {
    throw new AppError("Choose a valid booking scope.", 422);
  }

  if (
    status !== "ALL" &&
    ![...ACTIVE_BOOKING_STATUSES, ...TERMINAL_BOOKING_STATUSES].includes(status)
  ) {
    throw new AppError("Choose a valid booking status.", 422);
  }

  const baseWhere = {
    customerId: {
      in: customerIds
    }
  };
  const scopedWhere = {
    ...baseWhere,
    ...(scope === "upcoming"
      ? {
          status: {
            in: ACTIVE_BOOKING_STATUSES
          },
          startsAt: {
            gte: now
          }
        }
      : {}),
    ...(scope === "past"
      ? {
          OR: [
            {
              startsAt: {
                lt: now
              }
            },
            {
              status: {
                in: TERMINAL_BOOKING_STATUSES
              }
            }
          ]
        }
      : {}),
    ...(status !== "ALL" ? { status } : {})
  };

  const [total, filteredTotal, bookings] = await Promise.all([
    prisma.booking.count({ where: baseWhere }),
    prisma.booking.count({ where: scopedWhere }),
    prisma.booking.findMany({
      where: scopedWhere,
      orderBy: {
        startsAt: scope === "upcoming" ? "asc" : "desc"
      },
      take: 100,
      select: customerPortalBookingSelect
    })
  ]);

  return {
    user,
    profiles,
    bookings: bookings.map(mapBooking),
    summary: {
      total,
      filteredTotal
    }
  };
}

export async function getCustomerBookingContext({
  bookingId,
  select = customerPortalBookingSelect
}) {
  const { user, profiles, customerIds } =
    await requireCustomerPortalAccount();

  if (!isValidMongoObjectId(bookingId) || customerIds.length === 0) {
    throw new NotFoundError("Booking not found.");
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      customerId: {
        in: customerIds
      }
    },
    select: {
      ...select,
      id: true,
      businessId: true,
      serviceId: true,
      customerId: true,
      startsAt: true,
      endsAt: true,
      status: true
    }
  });

  if (!booking) {
    throw new NotFoundError("Booking not found.");
  }

  const business = await getBusinessForBooking({
    id: booking.businessId
  });

  return {
    user,
    profiles,
    booking,
    business
  };
}

export async function getCustomerBookingDetails({ bookingId }) {
  const { booking, business } =
    await getCustomerBookingContext({
      bookingId
    });
  const settings = getBookingSettings(business.settings);
  const canManage = canCustomerCancelBooking(booking, settings);

  return {
    booking,
    cancellationDeadline: getCancellationDeadline(booking, settings),
    canCancel: canManage,
    canReschedule: canManage,
    review: getCustomerReviewState(booking)
  };
}

export async function getCustomerProfile() {
  const { user, profiles } = await requireCustomerPortalAccount();

  return {
    user,
    profiles,
    profile: {
      name: user.name || profiles[0]?.name || "",
      email: user.email || profiles[0]?.email || "",
      phone: user.phone || profiles[0]?.phone || "",
      image: user.image || ""
    }
  };
}

export async function updateCustomerProfile(data) {
  const { user } = await requireCustomerPortalAccount();
  const name = data.name.trim();
  const phone = data.phone?.trim() || null;
  const image = data.image?.trim() || null;
  const updatedUser = await prisma.$transaction(async (transaction) => {
    const result = await transaction.user.update({
      where: {
        id: user.id
      },
      data: {
        name,
        phone,
        image,
        customerPortalEnabled: true
      },
      select: customerPortalUserSelect
    });

    await transaction.customer.updateMany({
      where: {
        userId: user.id
      },
      data: {
        name,
        phone
      }
    });

    return result;
  });

  return {
    user: {
      ...updatedUser,
      customerRole: CUSTOMER_ROLE,
      displayName: name
    },
    message: "Profile updated."
  };
}

export async function getCustomerSettings() {
  const { user, profiles } = await requireCustomerPortalAccount();

  return {
    user,
    profiles,
    settings: {
      customerEmailNotifications: user.customerEmailNotifications,
      customerBookingReminders: user.customerBookingReminders,
      customerMarketingOptIn: user.customerMarketingOptIn,
      locale: user.locale || profiles[0]?.locale || "en",
      timezone: user.timezone || profiles[0]?.timezone || "UTC"
    }
  };
}

export async function updateCustomerSettings(data) {
  const { user } = await requireCustomerPortalAccount();
  const updatedUser = await prisma.$transaction(async (transaction) => {
    const result = await transaction.user.update({
      where: {
        id: user.id
      },
      data: {
        customerPortalEnabled: true,
        customerEmailNotifications: data.customerEmailNotifications,
        customerBookingReminders: data.customerBookingReminders,
        customerMarketingOptIn: data.customerMarketingOptIn,
        locale: data.locale || null,
        timezone: data.timezone || null
      },
      select: customerPortalUserSelect
    });

    await transaction.customer.updateMany({
      where: {
        userId: user.id
      },
      data: {
        locale: data.locale || null,
        timezone: data.timezone || null,
        marketingOptIn: data.customerMarketingOptIn
      }
    });

    return result;
  });

  return {
    user: {
      ...updatedUser,
      customerRole: CUSTOMER_ROLE,
      displayName: updatedUser.name || updatedUser.email || "Customer"
    },
    settings: {
      customerEmailNotifications: updatedUser.customerEmailNotifications,
      customerBookingReminders: updatedUser.customerBookingReminders,
      customerMarketingOptIn: updatedUser.customerMarketingOptIn,
      locale: updatedUser.locale || "en",
      timezone: updatedUser.timezone || "UTC"
    },
    message: "Settings updated."
  };
}
