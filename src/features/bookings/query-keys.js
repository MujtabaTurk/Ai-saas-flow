export const bookingQueryKeys = {
  all: ["bookings"],
  list: (businessId, filters = {}) => [...bookingQueryKeys.all, "list", businessId || "current", filters],
  settings: (businessId) => [...bookingQueryKeys.all, "settings", businessId || "current"],
  publicBusiness: (businessSlug) => [...bookingQueryKeys.all, "public-business", businessSlug],
  publicSlots: (businessSlug, serviceId, date) => [
    ...bookingQueryKeys.all,
    "public-slots",
    businessSlug,
    serviceId,
    date
  ],
  publicBooking: (businessSlug, bookingNumber, token) => [
    ...bookingQueryKeys.all,
    "public-booking",
    businessSlug,
    bookingNumber,
    token
  ]
};

