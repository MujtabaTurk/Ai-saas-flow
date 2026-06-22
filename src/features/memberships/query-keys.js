export const membershipQueryKeys = {
  plans: (businessId) => ["membership-plans", businessId || "current"],
  membersRoot: (businessId) => ["memberships", businessId || "current"],
  members: (businessId, filters = {}) => [
    "memberships",
    businessId || "current",
    filters
  ],
  analytics: (businessId) => [
    "memberships",
    businessId || "current",
    "analytics"
  ],
  customer: () => ["customer-memberships"]
};
