import { getBusinessIntelligence, getAnalyticsRange } from "@/features/analytics/intelligence";
import { assertAnalyticsAccess, buildAnalyticsAccess, getRequestedBusinessId, requireAnalyticsContext } from "@/features/analytics/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

function parseRange(url) {
  const params = new URL(url).searchParams;
  if (params.get("start") && params.get("end")) {
    const start = new Date(`${params.get("start")}T00:00:00.000Z`);
    const end = new Date(`${params.get("end")}T23:59:59.999Z`);
    if (!Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf()) && start < end) return { start, end };
  }
  const days = Number(params.get("days") || 30);
  if (![1, 7, 30, 90, 365].includes(days)) throw new Error("Choose a valid analytics range.");
  return getAnalyticsRange({ days });
}

export async function GET(request) {
  try {
    const { user, business } = await requireAnalyticsContext(getRequestedBusinessId(request));
    const access = buildAnalyticsAccess({ user, business });
    assertAnalyticsAccess(access);
    const range = parseRange(request.url);
    return ok({ analytics: await getBusinessIntelligence({ businessId: business.id, timezone: business.timezone, ...range }), access });
  } catch (error) {
    return handleApiError(error);
  }
}
