import { getFinanceOverview, filterFinanceRequests } from "@/features/admin/finance";
import { requireSuperAdminContext } from "@/features/admin/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireSuperAdminContext();
    const status = new URL(request.url).searchParams.get("status") || "ALL";
    const finance = await getFinanceOverview();
    return ok({ ...finance, requests: filterFinanceRequests(finance.requests, status), status });
  } catch (error) {
    return handleApiError(error);
  }
}
