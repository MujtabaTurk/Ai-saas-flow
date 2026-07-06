import { DAYS_OF_WEEK } from "@/features/availability/constants";
import {
  addDaysToDateValue,
  formatDateTimeInTimezone,
  formatTimeRange
} from "@/features/availability/time";
import { getBookingCreationAccess } from "@/features/bookings/access";
import { getBookingSettings } from "@/features/bookings/lifecycle";
import { getAvailableSlotsForBusiness } from "@/features/bookings/slot-service";
import { BUSINESS_INDUSTRIES } from "@/features/businesses/constants";
import {
  getPublicReviewSummary,
  mapPublicReview,
  publicReviewSelect
} from "@/features/reviews/server";
import { prisma } from "@/lib/prisma";

export const BUSINESS_DIRECTORY_PAGE_SIZE = 12;
export const LANDING_FEATURED_BUSINESSES_LIMIT = 6;

const SORT_VALUES = new Set(["recommended", "newest", "name"]);
const FACET_LIMIT = 24;
const FACET_SOURCE_LIMIT = 500;
const UPCOMING_SLOT_LOOKAHEAD_DAYS = 14;
const UPCOMING_SLOT_SERVICE_LIMIT = 3;
const UPCOMING_SLOT_LIMIT = 6;

const activeDiscoverableBusinessWhere = {
  status: "ACTIVE",
  OR: [
    {
      services: {
        some: {
          isActive: true,
          type: "BOOKING"
        }
      }
    },
    {
      membershipPlans: {
        some: {
          isActive: true
        }
      }
    }
  ]
};

const latestSubscriptionSelect = {
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
};

const servicePreviewSelect = {
  where: {
    isActive: true,
    type: "BOOKING"
  },
  orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  select: {
    id: true,
    slug: true,
    name: true,
    description: true,
    durationMin: true,
    priceCents: true,
    currency: true,
    requiresPayment: true,
    bufferBeforeMin: true,
    bufferAfterMin: true,
    isActive: true
  }
};

const membershipPlanPreviewSelect = {
  where: {
    isActive: true
  },
  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  select: {
    id: true,
    slug: true,
    name: true,
    description: true,
    features: true,
    priceCents: true,
    currency: true,
    billingInterval: true,
    durationDays: true,
    trialDays: true,
    requiresPayment: true,
    isActive: true
  }
};
const industryLabelByValue = new Map(
  BUSINESS_INDUSTRIES.map((industry) => [industry.value, industry.label])
);

function getSearchParam(searchParams, key) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function cleanParam(value, maxLength = 80) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function cleanPage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function parseBusinessDirectoryFilters(searchParams = {}) {
  const sort = cleanParam(getSearchParam(searchParams, "sort"), 32);

  return {
    q: cleanParam(getSearchParam(searchParams, "q")),
    industry: cleanParam(getSearchParam(searchParams, "industry")),
    city: cleanParam(getSearchParam(searchParams, "city")),
    sort: SORT_VALUES.has(sort) ? sort : "recommended",
    page: cleanPage(getSearchParam(searchParams, "page"))
  };
}

function buildDirectoryWhere(filters) {
  const where = {
    AND: [activeDiscoverableBusinessWhere]
  };

  if (filters.industry) {
    where.AND.push({
      industry: {
        equals: filters.industry,
        mode: "insensitive"
      }
    });
  }

  if (filters.city) {
    where.AND.push({
      city: {
        equals: filters.city,
        mode: "insensitive"
      }
    });
  }

  if (filters.q) {
    const containsSearch = {
      contains: filters.q,
      mode: "insensitive"
    };

    where.AND.push({
      OR: [
        { name: containsSearch },
        { slug: containsSearch },
        { description: containsSearch },
        { industry: containsSearch },
        { city: containsSearch },
        { country: containsSearch },
        {
          services: {
            some: {
              isActive: true,
              type: "BOOKING",
              OR: [
                { name: containsSearch },
                { description: containsSearch }
              ]
            }
          }
        },
        {
          membershipPlans: {
            some: {
              isActive: true,
              OR: [
                { name: containsSearch },
                { description: containsSearch }
              ]
            }
          }
        }
      ]
    });
  }

  return where;
}

function getDirectoryOrderBy(sort) {
  if (sort === "name") {
    return [{ name: "asc" }];
  }

  if (sort === "newest") {
    return [{ createdAt: "desc" }];
  }

  return [{ createdAt: "desc" }];
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((first, second) => first.localeCompare(second))
    .slice(0, FACET_LIMIT);
}

function formatBusinessLocation(business) {
  return [business.city, business.country].filter(Boolean).join(", ");
}

function formatBusinessCategory(industry) {
  return industryLabelByValue.get(industry) || industry || "Service business";
}

function formatBusinessAddress(business) {
  return [
    business.addressLine1,
    business.addressLine2,
    business.city,
    business.country
  ]
    .filter(Boolean)
    .join(", ");
}

function createPagination({ page, totalItems }) {
  const totalPages = Math.max(
    Math.ceil(totalItems / BUSINESS_DIRECTORY_PAGE_SIZE),
    1
  );

  return {
    page,
    pageSize: BUSINESS_DIRECTORY_PAGE_SIZE,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

async function getDiscoveryFacets() {
  const businesses = await prisma.business.findMany({
    where: activeDiscoverableBusinessWhere,
    orderBy: {
      name: "asc"
    },
    take: FACET_SOURCE_LIMIT,
    select: {
      industry: true,
      city: true
    }
  });

  return {
    industries: uniqueSorted(
      businesses.map((business) => business.industry?.trim())
    ),
    cities: uniqueSorted(businesses.map((business) => business.city?.trim()))
  };
}

async function getReviewSummaryMap(businessIds) {
  const entries = await Promise.all(
    businessIds.map(async (businessId) => [
      businessId,
      await getPublicReviewSummary(businessId)
    ])
  );

  return new Map(entries);
}

async function mapDirectoryBusiness(business, reviewSummaryMap) {
  const settings = getBookingSettings(business.settings);
  const access = await getBookingCreationAccess({ business });
  const reviewSummary = reviewSummaryMap.get(business.id) || {
    total: 0,
    averageRating: null
  };

  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    description: business.description,
    industry: business.industry,
    logoUrl: business.logoUrl,
    location: formatBusinessLocation(business),
    timezone: business.timezone,
    acceptingBookings:
      access.canCreate &&
      settings.allowGuestBookings &&
      business.services.length > 0,
    services: business.services.map((service) => ({
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: service.description,
      durationMin: service.durationMin,
      priceCents: service.priceCents,
      currency: service.currency,
      requiresPayment: service.requiresPayment
    })),
    membershipPlans: business.membershipPlans.map((plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      features: plan.features,
      priceCents: plan.priceCents,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      durationDays: plan.durationDays,
      trialDays: plan.trialDays,
      requiresPayment: plan.requiresPayment
    })),
    reviewSummary
  };
}

async function mapLandingBusiness(business, reviewSummaryMap) {
  const settings = getBookingSettings(business.settings);
  const access = await getBookingCreationAccess({ business });
  const reviewSummary = reviewSummaryMap.get(business.id) || {
    total: 0,
    averageRating: null
  };
  const serviceNames = business.services.map((service) => service.name);
  const planNames = business.membershipPlans.map((plan) => plan.name);
  const focus = [...serviceNames, ...planNames].slice(0, 3).join(", ");

  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    category: formatBusinessCategory(business.industry),
    description:
      business.description ||
      (focus ? `Offering ${focus}.` : "Service business accepting online discovery through ServiceFlow."),
    imageUrl: business.logoUrl,
    location: formatBusinessLocation(business),
    rating: reviewSummary.averageRating,
    reviewCount: reviewSummary.total,
    acceptingBookings:
      access.canCreate &&
      settings.allowGuestBookings &&
      business.services.length > 0,
    services: serviceNames,
    membershipPlans: planNames
  };
}

export async function getLandingFeaturedBusinesses({
  limit = LANDING_FEATURED_BUSINESSES_LIMIT
} = {}) {
  const take = Math.max(1, Math.min(Number(limit) || LANDING_FEATURED_BUSINESSES_LIMIT, 12));
  const businesses = await prisma.business.findMany({
    where: activeDiscoverableBusinessWhere,
    orderBy: [{ createdAt: "desc" }],
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      industry: true,
      city: true,
      country: true,
      logoUrl: true,
      status: true,
      settings: true,
      subscriptions: latestSubscriptionSelect,
      services: {
        ...servicePreviewSelect,
        take: 3
      },
      membershipPlans: {
        ...membershipPlanPreviewSelect,
        take: 3
      }
    }
  });
  const reviewSummaryMap = await getReviewSummaryMap(
    businesses.map((business) => business.id)
  );

  return Promise.all(
    businesses.map((business) =>
      mapLandingBusiness(business, reviewSummaryMap)
    )
  );
}

export async function getBusinessDirectory(searchParams = {}) {
  const filters = parseBusinessDirectoryFilters(searchParams);
  const where = buildDirectoryWhere(filters);
  const totalItems = await prisma.business.count({ where });
  const totalPages = Math.max(
    Math.ceil(totalItems / BUSINESS_DIRECTORY_PAGE_SIZE),
    1
  );
  const page = Math.min(filters.page, totalPages);
  const [businesses, facets] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy: getDirectoryOrderBy(filters.sort),
      skip: (page - 1) * BUSINESS_DIRECTORY_PAGE_SIZE,
      take: BUSINESS_DIRECTORY_PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        industry: true,
        city: true,
        country: true,
        logoUrl: true,
        status: true,
        timezone: true,
        currency: true,
        locale: true,
        settings: true,
        subscriptions: latestSubscriptionSelect,
        services: {
          ...servicePreviewSelect,
          take: 3
        },
        membershipPlans: {
          ...membershipPlanPreviewSelect,
          take: 3
        }
      }
    }),
    getDiscoveryFacets()
  ]);
  const reviewSummaryMap = await getReviewSummaryMap(
    businesses.map((business) => business.id)
  );
  const mappedBusinesses = await Promise.all(
    businesses.map((business) =>
      mapDirectoryBusiness(business, reviewSummaryMap)
    )
  );

  return {
    businesses: mappedBusinesses,
    filters: {
      ...filters,
      page
    },
    facets,
    pagination: createPagination({
      page,
      totalItems
    })
  };
}

function sortAvailability(availability) {
  const dayOrder = new Map(
    DAYS_OF_WEEK.map((day, index) => [day.value, index])
  );

  return [...availability].sort((first, second) => {
    const dayDifference =
      (dayOrder.get(first.dayOfWeek) ?? 0) -
      (dayOrder.get(second.dayOfWeek) ?? 0);

    if (dayDifference !== 0) {
      return dayDifference;
    }

    return first.startTime.localeCompare(second.startTime);
  });
}

function mapAvailabilityByDay(availability) {
  const dayMap = new Map(
    DAYS_OF_WEEK.map((day) => [
      day.value,
      {
        value: day.value,
        label: day.label,
        ranges: []
      }
    ])
  );

  for (const range of sortAvailability(availability)) {
    dayMap.get(range.dayOfWeek)?.ranges.push({
      time: formatTimeRange(range.startTime, range.endTime),
      serviceName: range.service?.name || "All services"
    });
  }

  return [...dayMap.values()].filter((day) => day.ranges.length > 0);
}

async function getUpcomingAvailabilitySlots({ business, services, settings }) {
  if (!settings.allowGuestBookings || services.length === 0) {
    return [];
  }

  const today = formatDateTimeInTimezone(
    new Date(),
    business.timezone
  ).date;
  const lookaheadDays = Math.min(
    settings.bookingWindowDays,
    UPCOMING_SLOT_LOOKAHEAD_DAYS
  );
  const previewServices = services.slice(0, UPCOMING_SLOT_SERVICE_LIMIT);
  const slots = [];
  const seenStarts = new Set();

  for (
    let offset = 0;
    offset <= lookaheadDays && slots.length < UPCOMING_SLOT_LIMIT;
    offset += 1
  ) {
    const dateValue = addDaysToDateValue(today, offset);
    const dailySlots = await Promise.all(
      previewServices.map(async (service) => {
        const serviceSlots = await getAvailableSlotsForBusiness({
          business,
          service,
          dateValue
        });

        return serviceSlots.slice(0, 2).map((slot) => ({
          ...slot,
          serviceId: service.id,
          serviceName: service.name
        }));
      })
    );

    for (const slot of dailySlots.flat()) {
      const key = `${slot.startsAt}-${slot.serviceId}`;

      if (!seenStarts.has(key)) {
        seenStarts.add(key);
        slots.push(slot);
      }
    }

    slots.sort((first, second) => first.startsAt.localeCompare(second.startsAt));
  }

  return slots.slice(0, UPCOMING_SLOT_LIMIT);
}

function mapTeamMembers(memberships) {
  return memberships
    .map((membership) => ({
      id: membership.id,
      name: membership.user?.name || "Team member",
      role: membership.role === "ADMIN" ? "Admin" : "Staff"
    }))
    .filter((member) => member.name);
}

export async function getBusinessDiscoveryDetail(slug) {
  const business = await prisma.business.findUnique({
    where: {
      slug
    },
    select: {
      id: true,
      slug: true,
      name: true,
      legalName: true,
      description: true,
      industry: true,
      website: true,
      email: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      country: true,
      logoUrl: true,
      status: true,
      timezone: true,
      currency: true,
      locale: true,
      settings: true,
      subscriptions: latestSubscriptionSelect,
      services: servicePreviewSelect,
      membershipPlans: membershipPlanPreviewSelect,
      memberships: {
        where: {
          isActive: true
        },
        orderBy: {
          joinedAt: "asc"
        },
        take: 8,
        select: {
          id: true,
          role: true,
          user: {
            select: {
              name: true
            }
          }
        }
      },
      availabilities: {
        where: {
          isActive: true
        },
        orderBy: {
          startTime: "asc"
        },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          serviceId: true,
          service: {
            select: {
              name: true
            }
          }
        }
      },
      reviews: {
        where: {
          status: "PUBLISHED"
        },
        orderBy: {
          publishedAt: "desc"
        },
        take: 8,
        select: publicReviewSelect
      }
    }
  });

  if (
    !business ||
    business.status !== "ACTIVE" ||
    (business.services.length === 0 && business.membershipPlans.length === 0)
  ) {
    return null;
  }

  const settings = getBookingSettings(business.settings);
  const [reviewSummary, access] = await Promise.all([
    getPublicReviewSummary(business.id),
    getBookingCreationAccess({ business })
  ]);
  const acceptingBookings =
    access.canCreate && settings.allowGuestBookings && business.services.length > 0;
  const upcomingSlots = acceptingBookings
    ? await getUpcomingAvailabilitySlots({
        business,
        services: business.services,
        settings
      })
    : [];

  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    legalName: business.legalName,
    description: business.description,
    industry: business.industry,
    website: business.website,
    email: business.email,
    phone: business.phone,
    logoUrl: business.logoUrl,
    timezone: business.timezone,
    currency: business.currency,
    locale: business.locale,
    location: formatBusinessLocation(business),
    address: formatBusinessAddress(business),
    acceptingBookings,
    settings,
    services: business.services,
    membershipPlans: business.membershipPlans,
    teamMembers: mapTeamMembers(business.memberships),
    availability: mapAvailabilityByDay(business.availabilities),
    upcomingSlots,
    reviews: business.reviews.map(mapPublicReview),
    reviewSummary
  };
}
