import { processWithdrawalRequest } from "@/features/wallet/withdrawals";
import { requireSuperAdminContext } from "@/features/admin/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { notifyWithdrawalEvent } from "@/features/notifications/events";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireSuperAdminContext();
    const { requestId } = await params;
    const payload = await request.json().catch(() => null);
    const withdrawal = await processWithdrawalRequest({
      user,
      requestId,
      action: payload?.action,
      notes: payload?.notes
    });
    const event = { APPROVE: "APPROVED", REJECT: "REJECTED", PAID: "PAID" }[payload?.action];
    if (event) {
      try {
        await notifyWithdrawalEvent({ request: withdrawal, event });
      } catch (notificationError) {
        console.error("Could not queue withdrawal status notification.", notificationError);
      }
    }
    return ok({ withdrawal });
  } catch (error) {
    return handleApiError(error);
  }
}
