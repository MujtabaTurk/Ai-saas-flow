export const analyticsQueryKeys = {
  all: ["analytics"],
  report: (businessId, days) => [
    ...analyticsQueryKeys.all,
    businessId || "current",
    days
  ]
};
