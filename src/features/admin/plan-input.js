import { AppError } from "@/lib/api/errors";

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

export function normalizePlanInput(input, existing = {}) {
  const name = cleanString(input.name ?? existing.name);
  const code = cleanString(input.code ?? existing.code).toUpperCase().replace(/[^A-Z0-9_-]/g, "-");
  if (!name || !code) throw new AppError("Plan name and code are required.", 422);
  const integer = (value, fallback = 0) => {
    const number = Number(value ?? fallback);
    if (!Number.isInteger(number) || number < 0) throw new AppError("Limits and prices must be non-negative whole numbers.", 422);
    return number;
  };
  return {
    code, name,
    monthlyPriceCents: integer(input.monthlyPriceCents, existing.monthlyPriceCents),
    yearlyPriceCents: input.yearlyPriceCents === null || input.yearlyPriceCents === "" ? null : integer(input.yearlyPriceCents, existing.yearlyPriceCents || 0),
    description: cleanString(input.description ?? existing.description) || null,
    features: Array.isArray(input.features) ? input.features.map(cleanString).filter(Boolean) : (existing.features || []),
    trialDays: integer(input.trialDays, existing.trialDays),
    limits: input.limits && typeof input.limits === "object" ? input.limits : (existing.limits || {}),
    aiFeatures: input.aiFeatures && typeof input.aiFeatures === "object" ? input.aiFeatures : (existing.aiFeatures || {}),
    prioritySupport: Boolean(input.prioritySupport ?? existing.prioritySupport),
    stripePriceId: cleanString(input.stripePriceId ?? existing.stripePriceId) || null,
    stripeProductId: cleanString(input.stripeProductId ?? existing.stripeProductId) || null,
    status: ["ACTIVE", "INACTIVE", "ARCHIVED"].includes(input.status) ? input.status : (existing.status || "ACTIVE"),
    sortOrder: integer(input.sortOrder, existing.sortOrder)
  };
}
