import { centsToPrice, priceToCents } from "@/features/services/money";
import { normalizeServiceSlug } from "@/features/services/slug";

export function mapServiceFormToApiPayload(values) {
  return {
    name: values.name,
    slug: normalizeServiceSlug(values.slug),
    description: values.description || null,
    durationMin: Number(values.durationMin),
    bufferBeforeMin: Number(values.bufferBeforeMin || 0),
    bufferAfterMin: Number(values.bufferAfterMin || 0),
    priceCents: priceToCents(values.price),
    currency: values.currency,
    requiresPayment: Boolean(values.requiresPayment),
    sortOrder: Number(values.sortOrder || 0)
  };
}

export function mapServiceToFormValues(service, businessCurrency = "usd") {
  return {
    name: service?.name || "",
    slug: service?.slug || "",
    description: service?.description || "",
    durationMin: service?.durationMin || 60,
    bufferBeforeMin: service?.bufferBeforeMin || 0,
    bufferAfterMin: service?.bufferAfterMin || 0,
    price: centsToPrice(service?.priceCents),
    currency: service?.currency || businessCurrency,
    requiresPayment: Boolean(service?.requiresPayment),
    sortOrder: service?.sortOrder || 0
  };
}

