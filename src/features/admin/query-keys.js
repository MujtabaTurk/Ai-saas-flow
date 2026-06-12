export const adminQueryKeys = {
  all: ["admin"],
  businessesRoot: () => [...adminQueryKeys.all, "businesses"],
  businesses: (filters) => [...adminQueryKeys.businessesRoot(), filters],
  usersRoot: () => [...adminQueryKeys.all, "users"],
  users: (filters) => [...adminQueryKeys.usersRoot(), filters],
  subscriptionsRoot: () => [...adminQueryKeys.all, "subscriptions"],
  subscriptions: (filters) => [
    ...adminQueryKeys.subscriptionsRoot(),
    filters
  ],
  plans: () => [...adminQueryKeys.all, "plans"],
  activityRoot: () => [...adminQueryKeys.all, "activity"],
  activity: (filters) => [...adminQueryKeys.activityRoot(), filters]
};
