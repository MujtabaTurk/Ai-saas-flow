import {
  addDaysToDateValue,
  formatDateTimeInTimezone,
  zonedDateTimeToUtc
} from "@/features/availability/time";
import {
  ANALYTICS_SOURCE_ORDER,
  ANALYTICS_STATUS_ORDER,
  ANALYTICS_WEEKDAY_ORDER
} from "@/features/analytics/constants";
import { prisma } from "@/lib/prisma";

const NON_CANCELED_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW"
];

const bookingAnalyticsSelect = {
  id: true,
  serviceId: true,
  customerId: true,
  assignedMemberId: true,
  serviceNameSnapshot: true,
  serviceDurationMinSnapshot: true,
  servicePriceCentsSnapshot: true,
  serviceCurrencySnapshot: true,
  startsAt: true,
  status: true,
  source: true
};

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function percentage(numerator, denominator) {
  return denominator === 0 ? 0 : roundOne((numerator / denominator) * 100);
}

function comparisonPercent(current, previous) {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return roundOne(((current - previous) / previous) * 100);
}

function sumValues(bookings, predicate, currency) {
  return bookings.reduce((total, booking) => {
    if (
      !predicate(booking) ||
      booking.serviceCurrencySnapshot !== currency
    ) {
      return total;
    }

    return total + (booking.servicePriceCentsSnapshot || 0);
  }, 0);
}

function countByStatus(bookings) {
  const counts = Object.fromEntries(
    ANALYTICS_STATUS_ORDER.map((status) => [status, 0])
  );

  for (const booking of bookings) {
    counts[booking.status] = (counts[booking.status] || 0) + 1;
  }

  return counts;
}

function summarizeBookings(bookings, currency) {
  const statusCounts = countByStatus(bookings);
  const completed = statusCounts.COMPLETED || 0;
  const canceled = statusCounts.CANCELED || 0;
  const noShow = statusCounts.NO_SHOW || 0;
  const terminal = completed + canceled + noShow;
  const nonCanceled = bookings.filter((booking) =>
    NON_CANCELED_STATUSES.includes(booking.status)
  );
  const uniqueCustomers = new Set(
    nonCanceled.map((booking) => booking.customerId)
  ).size;
  const mismatchedCurrencyBookings = nonCanceled.filter(
    (booking) =>
      booking.servicePriceCentsSnapshot !== null &&
      booking.serviceCurrencySnapshot !== currency
  ).length;

  return {
    total: bookings.length,
    statusCounts,
    completed,
    canceled,
    noShow,
    completionRate: percentage(completed, terminal),
    cancellationRate: percentage(canceled, bookings.length),
    noShowRate: percentage(noShow, terminal),
    uniqueCustomers,
    bookedValueCents: sumValues(
      bookings,
      (booking) => NON_CANCELED_STATUSES.includes(booking.status),
      currency
    ),
    completedValueCents: sumValues(
      bookings,
      (booking) => booking.status === "COMPLETED",
      currency
    ),
    completedHours: roundOne(
      bookings
        .filter((booking) => booking.status === "COMPLETED")
        .reduce(
          (total, booking) =>
            total + booking.serviceDurationMinSnapshot,
          0
        ) / 60
    ),
    mismatchedCurrencyBookings
  };
}

function getPeriod({ days, timezone, now }) {
  const today = formatDateTimeInTimezone(now, timezone).date;
  const startDate = addDaysToDateValue(today, -(days - 1));
  const endDate = addDaysToDateValue(today, 1);
  const previousStartDate = addDaysToDateValue(startDate, -days);
  const start = zonedDateTimeToUtc(startDate, "00:00", timezone);
  const end = zonedDateTimeToUtc(endDate, "00:00", timezone);
  const previousStart = zonedDateTimeToUtc(
    previousStartDate,
    "00:00",
    timezone
  );

  return {
    days,
    startDate,
    endDate: today,
    start,
    end,
    previousStart,
    previousEnd: start,
    previousStartDate,
    previousEndDate: addDaysToDateValue(startDate, -1)
  };
}

function getBucketSize(days) {
  if (days <= 30) {
    return 1;
  }

  return days <= 90 ? 7 : 30;
}

function buildTrend(bookings, period, timezone, currency) {
  const bucketSize = getBucketSize(period.days);
  const buckets = [];

  for (let offset = 0; offset < period.days; offset += bucketSize) {
    const bucketStart = addDaysToDateValue(period.startDate, offset);
    const bucketEnd = addDaysToDateValue(
      period.startDate,
      Math.min(offset + bucketSize - 1, period.days - 1)
    );

    buckets.push({
      startDate: bucketStart,
      endDate: bucketEnd,
      bookings: 0,
      completed: 0,
      canceled: 0,
      bookedValueCents: 0
    });
  }

  for (const booking of bookings) {
    const localDate = formatDateTimeInTimezone(
      booking.startsAt,
      timezone
    ).date;
    const offset = Math.floor(
      (Date.parse(`${localDate}T00:00:00Z`) -
        Date.parse(`${period.startDate}T00:00:00Z`)) /
        (24 * 60 * 60 * 1000)
    );
    const bucketIndex = Math.floor(offset / bucketSize);
    const bucket = buckets[bucketIndex];

    if (!bucket) {
      continue;
    }

    bucket.bookings += 1;

    if (booking.status === "COMPLETED") {
      bucket.completed += 1;
    }

    if (booking.status === "CANCELED") {
      bucket.canceled += 1;
    }

    if (
      NON_CANCELED_STATUSES.includes(booking.status) &&
      booking.serviceCurrencySnapshot === currency
    ) {
      bucket.bookedValueCents +=
        booking.servicePriceCentsSnapshot || 0;
    }
  }

  return {
    bucketDays: bucketSize,
    points: buckets
  };
}

function buildServicePerformance(bookings, currency) {
  const services = new Map();

  for (const booking of bookings) {
    const key = booking.serviceId;
    const service = services.get(key) || {
      serviceId: key,
      name: booking.serviceNameSnapshot,
      bookings: 0,
      completed: 0,
      canceled: 0,
      noShow: 0,
      bookedValueCents: 0
    };

    service.bookings += 1;
    service.completed += booking.status === "COMPLETED" ? 1 : 0;
    service.canceled += booking.status === "CANCELED" ? 1 : 0;
    service.noShow += booking.status === "NO_SHOW" ? 1 : 0;

    if (
      NON_CANCELED_STATUSES.includes(booking.status) &&
      booking.serviceCurrencySnapshot === currency
    ) {
      service.bookedValueCents +=
        booking.servicePriceCentsSnapshot || 0;
    }

    services.set(key, service);
  }

  return [...services.values()]
    .map((service) => ({
      ...service,
      completionRate: percentage(
        service.completed,
        service.completed + service.canceled + service.noShow
      )
    }))
    .sort(
      (left, right) =>
        right.bookings - left.bookings ||
        right.bookedValueCents - left.bookedValueCents
    )
    .slice(0, 10);
}

function buildSourceDistribution(bookings) {
  const counts = Object.fromEntries(
    ANALYTICS_SOURCE_ORDER.map((source) => [source, 0])
  );

  for (const booking of bookings) {
    counts[booking.source] = (counts[booking.source] || 0) + 1;
  }

  return ANALYTICS_SOURCE_ORDER.map((source) => ({
    source,
    bookings: counts[source] || 0,
    percentage: percentage(counts[source] || 0, bookings.length)
  }));
}

function getWeekday(dateValue) {
  const day = new Date(`${dateValue}T00:00:00Z`).getUTCDay();

  return [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ][day];
}

function buildDemandPatterns(bookings, timezone) {
  const activeBookings = bookings.filter((booking) =>
    NON_CANCELED_STATUSES.includes(booking.status)
  );
  const weekdayCounts = Object.fromEntries(
    ANALYTICS_WEEKDAY_ORDER.map((weekday) => [weekday, 0])
  );
  const hourCounts = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    bookings: 0
  }));

  for (const booking of activeBookings) {
    const local = formatDateTimeInTimezone(booking.startsAt, timezone);
    const weekday = getWeekday(local.date);
    const hour = Number(local.time.slice(0, 2));
    weekdayCounts[weekday] += 1;
    hourCounts[hour].bookings += 1;
  }

  return {
    weekdays: ANALYTICS_WEEKDAY_ORDER.map((weekday) => ({
      weekday,
      bookings: weekdayCounts[weekday]
    })),
    hours: hourCounts
      .filter((entry) => entry.bookings > 0)
      .sort((left, right) => right.bookings - left.bookings)
      .slice(0, 8)
  };
}

function buildTeamWorkload(bookings, memberships, currency) {
  const membershipMap = new Map(
    memberships.map((membership) => [membership.id, membership])
  );
  const workload = new Map();

  for (const booking of bookings) {
    const key = booking.assignedMemberId || "UNASSIGNED";
    const membership = membershipMap.get(key);
    const entry = workload.get(key) || {
      membershipId:
        booking.assignedMemberId || null,
      name:
        membership?.user?.name ||
        membership?.user?.email ||
        "Unassigned",
      bookings: 0,
      completed: 0,
      canceled: 0,
      bookedValueCents: 0
    };

    entry.bookings += 1;
    entry.completed += booking.status === "COMPLETED" ? 1 : 0;
    entry.canceled += booking.status === "CANCELED" ? 1 : 0;

    if (
      NON_CANCELED_STATUSES.includes(booking.status) &&
      booking.serviceCurrencySnapshot === currency
    ) {
      entry.bookedValueCents +=
        booking.servicePriceCentsSnapshot || 0;
    }

    workload.set(key, entry);
  }

  return [...workload.values()]
    .map((entry) => ({
      ...entry,
      completionRate: percentage(
        entry.completed,
        entry.completed + entry.canceled
      )
    }))
    .sort((left, right) => right.bookings - left.bookings)
    .slice(0, 10);
}

async function getReturningCustomerIds({
  businessId,
  customerIds,
  before
}) {
  if (customerIds.length === 0) {
    return [];
  }

  const groups = await prisma.booking.groupBy({
    by: ["customerId"],
    where: {
      businessId,
      customerId: {
        in: customerIds
      },
      startsAt: {
        lt: before
      },
      status: {
        not: "CANCELED"
      }
    },
    _count: {
      _all: true
    }
  });

  return groups.map((group) => group.customerId);
}

function mapReviewAggregate(aggregate) {
  return {
    published: aggregate._count._all,
    averageRating:
      aggregate._avg.rating === null
        ? null
        : roundOne(aggregate._avg.rating)
  };
}

export async function buildBusinessAnalytics({
  business,
  access,
  days,
  now = new Date()
}) {
  const period = getPeriod({
    days,
    timezone: business.timezone,
    now
  });
  const [
    bookings,
    currentNewCustomers,
    previousNewCustomers,
    currentReviewAggregate,
    previousReviewAggregate
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        businessId: business.id,
        startsAt: {
          gte: period.previousStart,
          lt: period.end
        }
      },
      orderBy: {
        startsAt: "asc"
      },
      select: bookingAnalyticsSelect
    }),
    prisma.customer.count({
      where: {
        businessId: business.id,
        createdAt: {
          gte: period.start,
          lt: period.end
        }
      }
    }),
    prisma.customer.count({
      where: {
        businessId: business.id,
        createdAt: {
          gte: period.previousStart,
          lt: period.previousEnd
        }
      }
    }),
    prisma.review.aggregate({
      where: {
        businessId: business.id,
        status: "PUBLISHED",
        publishedAt: {
          gte: period.start,
          lt: period.end
        }
      },
      _count: {
        _all: true
      },
      _avg: {
        rating: true
      }
    }),
    prisma.review.aggregate({
      where: {
        businessId: business.id,
        status: "PUBLISHED",
        publishedAt: {
          gte: period.previousStart,
          lt: period.previousEnd
        }
      },
      _count: {
        _all: true
      },
      _avg: {
        rating: true
      }
    })
  ]);
  const currentBookings = bookings.filter(
    (booking) =>
      booking.startsAt >= period.start && booking.startsAt < period.end
  );
  const previousBookings = bookings.filter(
    (booking) =>
      booking.startsAt >= period.previousStart &&
      booking.startsAt < period.previousEnd
  );
  const current = summarizeBookings(currentBookings, business.currency);
  const previous = summarizeBookings(
    previousBookings,
    business.currency
  );
  const review = mapReviewAggregate(currentReviewAggregate);
  const previousReview = mapReviewAggregate(previousReviewAggregate);
  const currentCustomerIds = [
    ...new Set(
      currentBookings
        .filter((booking) => booking.status !== "CANCELED")
        .map((booking) => booking.customerId)
    )
  ];
  const returningCustomerIds = access.isAdvanced
    ? await getReturningCustomerIds({
        businessId: business.id,
        customerIds: currentCustomerIds,
        before: period.start
      })
    : [];
  let advanced = null;

  if (access.isAdvanced) {
    const membershipIds = [
      ...new Set(
        currentBookings
          .map((booking) => booking.assignedMemberId)
          .filter(Boolean)
      )
    ];
    const memberships =
      membershipIds.length === 0
        ? []
        : await prisma.businessMembership.findMany({
            where: {
              businessId: business.id,
              id: {
                in: membershipIds
              }
            },
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          });

    advanced = {
      servicePerformance: buildServicePerformance(
        currentBookings,
        business.currency
      ),
      sourceDistribution: buildSourceDistribution(currentBookings),
      customerRetention: {
        uniqueBookingCustomers: currentCustomerIds.length,
        firstTimeBookingCustomers:
          currentCustomerIds.length - returningCustomerIds.length,
        returningBookingCustomers: returningCustomerIds.length,
        returningRate: percentage(
          returningCustomerIds.length,
          currentCustomerIds.length
        ),
        newCustomerProfiles: currentNewCustomers
      },
      demand: buildDemandPatterns(
        currentBookings,
        business.timezone
      ),
      teamWorkload: buildTeamWorkload(
        currentBookings,
        memberships,
        business.currency
      )
    };
  }

  return {
    generatedAt: now,
    currency: business.currency,
    period: {
      days: period.days,
      start: period.start,
      end: period.end,
      startDate: period.startDate,
      endDate: period.endDate,
      previousStart: period.previousStart,
      previousEnd: period.previousEnd,
      previousStartDate: period.previousStartDate,
      previousEndDate: period.previousEndDate
    },
    overview: {
      bookings: {
        total: current.total,
        previousTotal: previous.total,
        changePercent: comparisonPercent(
          current.total,
          previous.total
        ),
        completed: current.completed,
        completionRate: current.completionRate,
        canceled: current.canceled,
        cancellationRate: current.cancellationRate,
        noShow: current.noShow,
        noShowRate: current.noShowRate,
        completedHours: current.completedHours
      },
      value: {
        bookedValueCents: current.bookedValueCents,
        previousBookedValueCents: previous.bookedValueCents,
        changePercent: comparisonPercent(
          current.bookedValueCents,
          previous.bookedValueCents
        ),
        completedValueCents: current.completedValueCents,
        mismatchedCurrencyBookings:
          current.mismatchedCurrencyBookings
      },
      customers: {
        uniqueBookingCustomers: current.uniqueCustomers,
        previousUniqueBookingCustomers: previous.uniqueCustomers,
        changePercent: comparisonPercent(
          current.uniqueCustomers,
          previous.uniqueCustomers
        ),
        newCustomerProfiles: currentNewCustomers,
        previousNewCustomerProfiles: previousNewCustomers
      },
      reviews: {
        ...review,
        previousPublished: previousReview.published,
        publishedChangePercent: comparisonPercent(
          review.published,
          previousReview.published
        )
      }
    },
    statusDistribution: ANALYTICS_STATUS_ORDER.map((status) => ({
      status,
      bookings: current.statusCounts[status] || 0,
      percentage: percentage(
        current.statusCounts[status] || 0,
        current.total
      )
    })),
    trend: buildTrend(
      currentBookings,
      period,
      business.timezone,
      business.currency
    ),
    advanced
  };
}
