import { randomUUID } from "node:crypto";

export function getBillingRequestId(request, fallback = null) {
  return (
    request?.headers?.get("x-request-id") ||
    request?.headers?.get("stripe-request-id") ||
    fallback ||
    randomUUID()
  );
}

export function logBillingEvent(event, context = {}, level = "info") {
  const payload = {
    timestamp: new Date().toISOString(),
    event,
    ...Object.fromEntries(
      Object.entries(context).filter(([, value]) => value !== undefined)
    )
  };
  const logger = console[level] || console.info;

  logger(`[billing] ${JSON.stringify(payload)}`);
}
