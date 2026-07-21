import {
  createWithdrawalRequest,
  getBusinessWithdrawalRequests
} from "@/features/wallet/withdrawals";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { getCurrentSession } from "@/lib/auth/session";
import { notifyWithdrawalEvent } from "@/features/notifications/events";

export const runtime = "nodejs";

function requestId(request) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return fail("Authentication is required.", 401);
    return ok({ requests: await getBusinessWithdrawalRequests(session.user) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) return fail("Authentication is required.", 401);
    const payload = await request.json().catch(() => null);
    const requestedAmount = Number(payload?.requestedAmount);
    if (!Number.isInteger(requestedAmount) || requestedAmount <= 0) {
      return fail("Withdrawal amount must be greater than zero.", 422);
    }
    const withdrawal = await createWithdrawalRequest({
      user: session.user,
      requestedAmount,
      notes: payload?.notes,
      idempotencyKey: requestId(request)
    });
    console.info(JSON.stringify({
      event: "WITHDRAW_REQUEST_CREATED",
      businessId: withdrawal.businessId,
      walletId: withdrawal.walletId,
      requestId: withdrawal.id,
      requestedAmount: withdrawal.requestedAmount
    }));
    try {
      await notifyWithdrawalEvent({ request: withdrawal, event: "CREATED" });
    } catch (notificationError) {
      console.error("Could not queue withdrawal submission notification.", notificationError);
    }
    return ok({ withdrawal }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
