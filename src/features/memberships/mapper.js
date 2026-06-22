export function mapMembershipPlanToFormValues(plan = null, businessCurrency = "usd") {
  return {
    name: plan?.name || "",
    slug: plan?.slug || "",
    description: plan?.description || "",
    price:
      plan?.priceCents === null || plan?.priceCents === undefined
        ? ""
        : String(plan.priceCents / 100),
    currency: plan?.currency || businessCurrency,
    billingInterval: plan?.billingInterval || "MONTHLY",
    durationDays: plan?.durationDays || 30,
    trialDays: plan?.trialDays || 0,
    maxActiveMembers: plan?.maxActiveMembers || "",
    requiresPayment: plan?.requiresPayment !== false,
    isActive: plan?.isActive !== false,
    sortOrder: plan?.sortOrder || 0,
    featureText: Array.isArray(plan?.features) ? plan.features.join("\n") : ""
  };
}

export function mapMembershipPlanFormToApiPayload(values) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || null,
    features: String(values.featureText || "")
      .split(/\r?\n/)
      .map((feature) => feature.trim())
      .filter(Boolean),
    priceCents:
      values.price === "" || values.price === null || values.price === undefined
        ? 0
        : Math.round(Number(values.price) * 100),
    currency: values.currency,
    billingInterval: values.billingInterval,
    durationDays: Number(values.durationDays),
    trialDays: Number(values.trialDays || 0),
    maxActiveMembers:
      values.maxActiveMembers === "" ||
      values.maxActiveMembers === null ||
      values.maxActiveMembers === undefined
        ? null
        : Number(values.maxActiveMembers),
    requiresPayment: Boolean(values.requiresPayment),
    isActive: Boolean(values.isActive),
    sortOrder: Number(values.sortOrder || 0)
  };
}
