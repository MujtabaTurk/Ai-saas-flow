import { normalizeServiceSlug } from "@/features/services/slug";

export function normalizeServiceInput(data) {
  return {
    name: data.name.trim(),
    slug: normalizeServiceSlug(data.slug),
    description: data.description?.trim() || null,
    durationMin: Number(data.durationMin),
    bufferBeforeMin: Number(data.bufferBeforeMin || 0),
    bufferAfterMin: Number(data.bufferAfterMin || 0),
    priceCents:
      data.priceCents === null || data.priceCents === undefined
        ? null
        : Number(data.priceCents),
    currency: data.currency,
    requiresPayment: Boolean(data.requiresPayment),
    sortOrder: Number(data.sortOrder || 0)
  };
}
