import { prisma } from "@/lib/prisma";
import { creditPlatformTreasury } from "@/features/wallet/treasury";

const PAYMENT_TRANSACTION_TYPE = "PAYMENT";
const COMPLETED_STATUS = "COMPLETED";

function logWalletCredit(stage, details = {}) {
  console.info(JSON.stringify({ event: "wallet.credit", stage, ...details }));
}

/**
 * Post-processes a successful booking payment. This service owns only wallet
 * persistence; callers must isolate failures from the payment flow.
 */
export async function creditWalletForBookingPayment({ booking, payment }) {
  logWalletCredit("WALLET_SERVICE_ENTERED", {
    businessId: booking?.businessId || null,
    bookingId: booking?.id || null,
    paymentId: payment?.id || null,
    paymentStatus: payment?.status || null
  });

  if (!booking?.id || !booking.businessId || !payment?.id) {
    return { credited: false, reason: "missing_payment_context" };
  }

  if (payment.status !== "SUCCEEDED") {
    return { credited: false, reason: "payment_not_succeeded" };
  }

  const paymentId = payment.id;
  const amount = payment.amountCents || 0;
  const businessRecord = await prisma.business.findUnique({
    where: { id: booking.businessId },
    select: { ownerId: true }
  });
  const ownerId = businessRecord?.ownerId || null;

  if (!businessRecord) {
    throw new Error("Wallet credit requires an existing business.");
  }

  if (!ownerId) {
    throw new Error("Wallet credit requires a business owner.");
  }

  try {
    logWalletCredit("WALLET_TRIGGER_REACHED", {
      businessId: booking.businessId,
      ownerId,
      bookingId: booking.id,
      paymentId,
      amount
    });

    const result = await prisma.$transaction(async (transaction) => {
      const existingTransaction = await transaction.walletTransaction.findFirst({
        where: { paymentId },
        select: { id: true }
      });

      if (existingTransaction) {
        const treasury = await creditPlatformTreasury({
          transaction,
          amount,
          referenceType: "BOOKING_PAYMENT",
          referenceId: paymentId,
          idempotencyKey: `PAYMENT:${paymentId}`,
          businessId: booking.businessId
        });
        return { credited: false, duplicate: true, treasuryCredited: treasury.credited };
      }

      logWalletCredit("WALLET_CREATE_STARTED", {
        businessId: booking.businessId,
        ownerId,
        paymentId
      });
      const wallet = await transaction.wallet.upsert({
        where: { businessId: booking.businessId },
        update: {},
        create: {
          businessId: booking.businessId,
          currency: payment.currency?.toUpperCase() || "USD"
        }
      });
      logWalletCredit("WALLET_CREATE_COMPLETED", {
        businessId: booking.businessId,
        ownerId,
        paymentId,
        walletId: wallet.id
      });

      logWalletCredit("TRANSACTION_CREATE_STARTED", {
        businessId: booking.businessId,
        ownerId,
        paymentId,
        walletId: wallet.id
      });
      await transaction.walletTransaction.create({
        data: {
          walletId: wallet.id,
          paymentId,
          idempotencyKey: paymentId,
          type: PAYMENT_TRANSACTION_TYPE,
          status: COMPLETED_STATUS,
          amount,
          credits: amount,
          referenceType: "BOOKING",
          referenceId: booking.id,
          notes: "Stripe payment received"
        }
      });
      logWalletCredit("TRANSACTION_CREATE_COMPLETED", {
        businessId: booking.businessId,
        ownerId,
        paymentId,
        walletId: wallet.id
      });

      logWalletCredit("REVENUE_UPDATE_STARTED", {
        businessId: booking.businessId,
        ownerId,
        paymentId,
        amount
      });
      await transaction.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingCredits: { increment: amount },
          lifetimeCredits: { increment: amount },
          monthlyRevenue: { increment: amount }
        }
      });
      await creditPlatformTreasury({
        transaction,
        amount,
        referenceType: "BOOKING_PAYMENT",
        referenceId: paymentId,
        idempotencyKey: `PAYMENT:${paymentId}`,
        businessId: booking.businessId
      });
      logWalletCredit("REVENUE_UPDATE_COMPLETED", {
        businessId: booking.businessId,
        ownerId,
        paymentId,
        amount
      });

      return { credited: true };
    });

    logWalletCredit(result.duplicate ? "duplicate_skipped" : "credited", {
      businessId: booking.businessId,
      ownerId,
      bookingId: booking.id,
      paymentId,
      amount
    });
    return result;
  } catch (error) {
    if (error?.code === "P2002") {
      logWalletCredit("duplicate_skipped", { paymentId });
      return { credited: false, duplicate: true };
    }

    logWalletCredit("failed", {
      businessId: booking.businessId,
      bookingId: booking.id,
      paymentId,
      errorCode: error?.code || null,
      errorMessage: error?.message || "Unknown wallet credit error"
    });
    throw error;
  }
}
