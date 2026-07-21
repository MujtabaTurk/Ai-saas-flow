const PAYMENT_TRANSACTION_TYPE = "PAYMENT";
const COMPLETED_STATUS = "COMPLETED";
import { settlePlatformTreasury } from "@/features/wallet/treasury";

function settlementLog(event, details = {}) {
  console.info(JSON.stringify({ event, ...details }));
}

/**
 * Moves a completed booking's successful payment from pending to available.
 * The caller supplies its active Prisma transaction so the wallet and the
 * settlement marker commit or roll back together.
 */
export async function settleWalletForCompletedBooking({ transaction, booking }) {
  const context = {
    businessId: booking?.businessId || null,
    bookingId: booking?.id || null
  };

  settlementLog("SETTLEMENT_STARTED", context);

  if (!booking?.id || !booking.businessId || booking.status !== "COMPLETED") {
    settlementLog("SETTLEMENT_SKIPPED", { ...context, reason: "booking_not_completed" });
    return { settled: false, reason: "booking_not_completed" };
  }

  const paymentTransaction = await transaction.walletTransaction.findFirst({
    where: {
      type: PAYMENT_TRANSACTION_TYPE,
      status: COMPLETED_STATUS,
      referenceType: "BOOKING",
      referenceId: booking.id,
      settledAt: null
    },
    orderBy: { createdAt: "asc" }
  });

  if (!paymentTransaction) {
    settlementLog("SETTLEMENT_SKIPPED", { ...context, reason: "no_unsettled_payment" });
    return { settled: false, reason: "no_unsettled_payment" };
  }

  const amount = paymentTransaction.credits || paymentTransaction.amount || 0;
  if (amount <= 0) {
    settlementLog("SETTLEMENT_SKIPPED", { ...context, walletId: paymentTransaction.walletId, reason: "invalid_amount" });
    return { settled: false, reason: "invalid_amount" };
  }

  const claimed = await transaction.walletTransaction.updateMany({
    where: {
      id: paymentTransaction.id,
      settledAt: null
    },
    data: { settledAt: new Date() }
  });

  if (claimed.count !== 1) {
    settlementLog("SETTLEMENT_SKIPPED", { ...context, walletId: paymentTransaction.walletId, reason: "already_settled" });
    return { settled: false, duplicate: true };
  }

  const walletUpdate = await transaction.wallet.updateMany({
    where: {
      id: paymentTransaction.walletId,
      businessId: booking.businessId,
      pendingCredits: { gte: amount }
    },
    data: {
      pendingCredits: { decrement: amount },
      availableCredits: { increment: amount }
    }
  });

  if (walletUpdate.count !== 1) {
    throw new Error("Wallet pending balance cannot cover this settlement.");
  }

  await settlePlatformTreasury({
    transaction,
    amount,
    referenceType: "BOOKING_SETTLEMENT",
    referenceId: booking.id,
    idempotencyKey: `SETTLEMENT:${paymentTransaction.id}`,
    businessId: booking.businessId
  });

  await transaction.walletTransaction.create({
    data: {
      walletId: paymentTransaction.walletId,
      type: "SETTLEMENT",
      status: COMPLETED_STATUS,
      amount,
      credits: amount,
      referenceType: "BOOKING",
      referenceId: booking.id,
      idempotencyKey: `SETTLEMENT:${paymentTransaction.id}`,
      notes: "Booking completed; credits released"
    }
  });

  settlementLog("WALLET_UPDATED", {
    ...context,
    walletId: paymentTransaction.walletId,
    amount
  });
  settlementLog("SETTLEMENT_COMPLETED", {
    ...context,
    walletId: paymentTransaction.walletId,
    walletTransactionId: paymentTransaction.id,
    amount
  });

  return {
    settled: true,
    amount,
    walletId: paymentTransaction.walletId,
    walletTransactionId: paymentTransaction.id
  };
}
