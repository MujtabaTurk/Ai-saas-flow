export const availabilityQueryKeys = {
  all: ["availability"],
  weekly: (businessId) => [...availabilityQueryKeys.all, "weekly", businessId || "current"],
  unavailableDates: (businessId) => [...availabilityQueryKeys.all, "unavailable-dates", businessId || "current"]
};

