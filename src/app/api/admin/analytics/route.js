import { getAnalyticsRange, getPlatformIntelligence } from "@/features/analytics/intelligence";
import { requireSuperAdminContext } from "@/features/admin/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireSuperAdminContext();
    const params = new URL(request.url).searchParams;
    const days = Number(params.get("days") || 30);
    if (![1, 7, 30, 90, 365].includes(days)) return fail("Choose a valid analytics range.", 422);
    const range = getAnalyticsRange({ days });
    return ok({ analytics: await getPlatformIntelligence({ timezone: "UTC", ...range }) });
  } catch (error) {
    return handleApiError(error);
  }
}
