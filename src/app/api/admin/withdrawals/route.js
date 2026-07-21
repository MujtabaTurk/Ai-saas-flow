import { getAdminWithdrawalRequests } from "@/features/wallet/withdrawals";
import { requireSuperAdminContext } from "@/features/admin/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireSuperAdminContext();
    const status = new URL(request.url).searchParams.get("status");
    const requests = await getAdminWithdrawalRequests({ status });
    console.info(JSON.stringify({
      event: "ADMIN_REQUEST_VISIBLE",
      count: requests.length,
      status: status || "ALL"
    }));
    return ok({ requests });
  } catch (error) {
    return handleApiError(error);
  }
}
