export const onboardingBusinessSelect = {
  id: true,
  name: true,
  slug: true,
  industry: true,
  email: true,
  phone: true,
  logoUrl: true,
  website: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  country: true,
  status: true,
  timezone: true,
  currency: true,
  locale: true,
  createdAt: true,
  subscriptions: {
    orderBy: {
      createdAt: "desc"
    },
    take: 1,
    select: {
      id: true,
      planCode: true,
      status: true,
      trialEndsAt: true,
      currentPeriodEnd: true
    }
  },
  settings: {
    select: {
      bookingLeadTimeMin: true,
      bookingWindowDays: true,
      cancellationWindowMin: true,
      allowGuestBookings: true,
      autoConfirmBookings: true
    }
  },
  availabilities: {
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      slotDurationMin: true,
      isActive: true
    }
  }
};

export function mapOnboardingBusiness(business) {
  if (!business) {
    return null;
  }

  const [subscription = null] = business.subscriptions || [];

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    publicBookingPath: `/${business.slug}`,
    industry: business.industry,
    logoUrl: business.logoUrl,
    contact: {
      email: business.email,
      phone: business.phone,
      website: business.website
    },
    location: {
      addressLine1: business.addressLine1,
      addressLine2: business.addressLine2,
      city: business.city,
      country: business.country
    },
    status: business.status,
    timezone: business.timezone,
    currency: business.currency,
    locale: business.locale,
    settings: business.settings,
    subscription,
    availabilityCount: business.availabilities?.length || 0,
    createdAt: business.createdAt
  };
}
