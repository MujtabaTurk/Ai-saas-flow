export const customerQueryKeys = {
  all: ["customers"],
  listRoot: (businessId) => [
    ...customerQueryKeys.all,
    "list",
    businessId || "current"
  ],
  list: (businessId, filters = {}) => [
    ...customerQueryKeys.listRoot(businessId),
    filters
  ],
  detailRoot: (businessId, customerId) => [
    ...customerQueryKeys.all,
    "detail",
    businessId || "current",
    customerId
  ],
  detail: (businessId, customerId, page) => [
    ...customerQueryKeys.detailRoot(businessId, customerId),
    page
  ]
};
