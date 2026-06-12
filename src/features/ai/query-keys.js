export const aiQueryKeys = {
  all: ["ai-assistant"],
  workspace: (businessId) => [
    ...aiQueryKeys.all,
    "workspace",
    businessId || "current"
  ]
};
