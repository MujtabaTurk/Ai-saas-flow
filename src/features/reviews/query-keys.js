export const reviewQueryKeys = {
  all: ["reviews"],
  listRoot: (businessId) => [
    ...reviewQueryKeys.all,
    "list",
    businessId || "current"
  ],
  list: (businessId, filters = {}) => [
    ...reviewQueryKeys.listRoot(businessId),
    filters
  ],
  publicBooking: (businessSlug, bookingNumber, token) => [
    ...reviewQueryKeys.all,
    "public-booking",
    businessSlug,
    bookingNumber,
    token
  ]
};
