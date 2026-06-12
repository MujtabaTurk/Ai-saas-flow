import { buildBusinessAnalytics } from "@/features/analytics/metrics";
import {
  assertAnalyticsAccess,
  buildAnalyticsAccess,
  getRequestedBusinessId,
  parseAnalyticsPeriod,
  requireAnalyticsContext
} from "@/features/analytics/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { user, business } = await requireAnalyticsContext(
      getRequestedBusinessId(request)
    );
    const access = buildAnalyticsAccess({ user, business });
    assertAnalyticsAccess(access);
    const days = parseAnalyticsPeriod(
      new URL(request.url).searchParams,
      access
    );
    const analytics = await buildBusinessAnalytics({
      business,
      access,
      days
    });

    return ok({
      analytics,
      access
    });
  } catch (error) {
    return handleApiError(error);
  }
}
