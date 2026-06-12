export const bookingQueryKeys = {
  all: ["bookings"],
  listRoot: (businessId) => [
    ...bookingQueryKeys.all,
    "list",
    businessId || "current"
  ],
  list: (businessId, filters = {}) => [
    ...bookingQueryKeys.listRoot(businessId),
    filters
  ],
  settings: (businessId) => [...bookingQueryKeys.all, "settings", businessId || "current"],
  dashboardSlots: (businessId, serviceId, date) => [
    ...bookingQueryKeys.all,
    "dashboard-slots",
    businessId || "current",
    serviceId,
    date
  ],
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
