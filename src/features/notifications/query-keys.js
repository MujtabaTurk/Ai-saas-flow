export const notificationQueryKeys = {
  all: ["notifications"],
  listRoot: (businessId) => [
    ...notificationQueryKeys.all,
    "list",
    businessId || "current"
  ],
  list: (businessId, filters = {}) => [
    ...notificationQueryKeys.listRoot(businessId),
    filters
  ]
};
