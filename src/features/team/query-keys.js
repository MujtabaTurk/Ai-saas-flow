export const teamQueryKeys = {
  all: ["team"],
  detail: (businessId) => [
    ...teamQueryKeys.all,
    businessId || "current"
  ],
  invitation: (token) => [
    ...teamQueryKeys.all,
    "invitation",
    token || "missing"
  ]
};
