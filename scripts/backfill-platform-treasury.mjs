import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const result = {
  successfulPayments: 0,
  walletCreditsCreated: 0,
  treasuryCreditsCreated: 0,
  skippedWalletCredits: 0,
  skippedTreasuryCredits: 0,
  totalCollectedAdded: 0,
  totalPendingLiabilityAdded: 0,
  totalAvailableLiabilityAdded: 0
};

async function repairPayment(payment) {
  return prisma.$transaction(async (transaction) => {
    const wallet = await transaction.wallet.upsert({
      where: { businessId: payment.businessId },
      update: {},
      create: { businessId: payment.businessId, currency: payment.currency?.toUpperCase() || "USD" }
    });
    let walletTransaction = await transaction.walletTransaction.findUnique({
      where: { paymentId: payment.id }
    });

    if (!walletTransaction) {
      walletTransaction = await transaction.walletTransaction.create({
        data: {
          walletId: wallet.id,
          paymentId: payment.id,
          idempotencyKey: payment.id,
          type: "PAYMENT",
          status: "COMPLETED",
          amount: payment.amountCents,
          credits: payment.amountCents,
          referenceType: "BOOKING",
          referenceId: payment.bookingId,
          notes: "Historical treasury backfill"
        }
      });
      await transaction.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingCredits: { increment: payment.amountCents },
          lifetimeCredits: { increment: payment.amountCents },
          monthlyRevenue: { increment: payment.amountCents }
        }
      });
      result.walletCreditsCreated += 1;
    } else {
      result.skippedWalletCredits += 1;
    }

    const treasuryWallet = await transaction.platformWallet.upsert({
      where: { key: "PLATFORM" },
      update: {},
      create: { key: "PLATFORM" }
    });
    const idempotencyKey = `PAYMENT:${payment.id}`;
    const existingTreasury = await transaction.platformWalletTransaction.findUnique({
      where: { idempotencyKey }
    });

    if (!existingTreasury) {
      const available = Boolean(walletTransaction.settledAt);
      await transaction.platformWalletTransaction.create({
        data: {
          platformWalletId: treasuryWallet.id,
          type: "CREDIT",
          amount: payment.amountCents,
          idempotencyKey,
          referenceType: "BOOKING_PAYMENT",
          referenceId: payment.id
        }
      });
      await transaction.platformWallet.update({
        where: { id: treasuryWallet.id },
        data: {
          totalCollectedCredits: { increment: payment.amountCents },
          currentTreasuryBalance: { increment: payment.amountCents },
          ...(available
            ? { totalAvailableLiability: { increment: payment.amountCents } }
            : { totalPendingLiability: { increment: payment.amountCents } })
        }
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: null,
          businessId: payment.businessId,
          action: "TREASURY_CREDITED",
          targetType: "PLATFORM_WALLET",
          targetId: treasuryWallet.id,
          metadata: { amount: payment.amountCents, referenceType: "BOOKING_PAYMENT", referenceId: payment.id, backfill: true }
        }
      });
      result.treasuryCreditsCreated += 1;
      result.totalCollectedAdded += payment.amountCents;
      if (available) result.totalAvailableLiabilityAdded += payment.amountCents;
      else result.totalPendingLiabilityAdded += payment.amountCents;
    } else {
      result.skippedTreasuryCredits += 1;
    }
  });
}

try {
  const payments = await prisma.bookingPayment.findMany({
    where: { status: "SUCCEEDED" },
    orderBy: { createdAt: "asc" }
  });
  result.successfulPayments = payments.length;
  if (!dryRun) {
    for (const payment of payments) await repairPayment(payment);
  }
  console.log(JSON.stringify({ dryRun, ...result }, null, 2));
} finally {
  await prisma.$disconnect();
}
