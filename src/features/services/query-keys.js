export const serviceQueryKeys = {
  all: ["services"],
  lists: () => [...serviceQueryKeys.all, "list"],
  list: (businessId) => [...serviceQueryKeys.lists(), businessId || "current"],
  detail: (serviceId) => [...serviceQueryKeys.all, "detail", serviceId]
};

