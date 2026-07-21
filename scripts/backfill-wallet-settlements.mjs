import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const result = {
  candidates: 0,
  settled: 0,
  skipped: 0,
  totalAmountMoved: 0,
  settlementMarkersCreated: 0,
  skipReasons: {}
};

function skip(reason) {
  result.skipped += 1;
  result.skipReasons[reason] = (result.skipReasons[reason] || 0) + 1;
}

async function settleHistoricalPayment(transaction, booking, paymentTransaction) {
  const amount = paymentTransaction.credits || paymentTransaction.amount || 0;
  if (amount <= 0) return { settled: false, reason: "invalid_amount" };

  await transaction.walletTransaction.update({
    where: { id: paymentTransaction.id },
    data: { settledAt: new Date() }
  });

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
    throw new Error(`Wallet pending balance cannot cover booking ${booking.id}.`);
  }

  const treasuryWallet = await transaction.platformWallet.upsert({
    where: { key: "PLATFORM" },
    update: {},
    create: { key: "PLATFORM" }
  });
  const treasurySettlementKey = `SETTLEMENT:${paymentTransaction.id}`;
  const existingTreasurySettlement = await transaction.platformWalletTransaction.findUnique({
    where: { idempotencyKey: treasurySettlementKey }
  });
  if (!existingTreasurySettlement) {
    const treasuryUpdate = await transaction.platformWallet.updateMany({
      where: { id: treasuryWallet.id, totalPendingLiability: { gte: amount } },
      data: {
        totalPendingLiability: { decrement: amount },
        totalAvailableLiability: { increment: amount }
      }
    });
    if (treasuryUpdate.count !== 1) {
      throw new Error(`Treasury pending liability cannot cover booking ${booking.id}.`);
    }
    await transaction.platformWalletTransaction.create({
      data: {
        platformWalletId: treasuryWallet.id,
        type: "SETTLEMENT",
        amount,
        idempotencyKey: treasurySettlementKey,
        referenceType: "BOOKING_SETTLEMENT",
        referenceId: booking.id
      }
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: null,
        businessId: booking.businessId,
        action: "TREASURY_SETTLED",
        targetType: "PLATFORM_WALLET",
        targetId: treasuryWallet.id,
        metadata: { amount, referenceType: "BOOKING_SETTLEMENT", referenceId: booking.id, backfill: true }
      }
    });
  }

  const existingSettlement = await transaction.walletTransaction.findUnique({
    where: { idempotencyKey: `SETTLEMENT:${paymentTransaction.id}` }
  });
  if (!existingSettlement) {
    await transaction.walletTransaction.create({
      data: {
        walletId: paymentTransaction.walletId,
        type: "SETTLEMENT",
        status: "COMPLETED",
        amount,
        credits: amount,
        referenceType: "BOOKING",
        referenceId: booking.id,
        idempotencyKey: `SETTLEMENT:${paymentTransaction.id}`,
        notes: "Historical booking settlement backfill"
      }
    });
  }

  return { settled: true, amount };
}

async function ensureHistoricalSettlementMarkers(transaction, booking, paymentTransaction) {
  const idempotencyKey = `SETTLEMENT:${paymentTransaction.id}`;
  const existingWalletSettlement = await transaction.walletTransaction.findUnique({ where: { idempotencyKey } });
  if (!existingWalletSettlement) {
    await transaction.walletTransaction.create({
      data: {
        walletId: paymentTransaction.walletId,
        type: "SETTLEMENT",
        status: "COMPLETED",
        amount: paymentTransaction.credits || paymentTransaction.amount || 0,
        credits: paymentTransaction.credits || paymentTransaction.amount || 0,
        referenceType: "BOOKING",
        referenceId: booking.id,
        idempotencyKey,
        notes: "Historical settlement marker"
      }
    });
    result.settlementMarkersCreated += 1;
  }

  const treasuryWallet = await transaction.platformWallet.upsert({
    where: { key: "PLATFORM" },
    update: {},
    create: { key: "PLATFORM" }
  });
  const existingTreasurySettlement = await transaction.platformWalletTransaction.findUnique({ where: { idempotencyKey } });
  if (!existingTreasurySettlement) {
    await transaction.platformWalletTransaction.create({
      data: {
        platformWalletId: treasuryWallet.id,
        type: "SETTLEMENT",
        amount: paymentTransaction.credits || paymentTransaction.amount || 0,
        idempotencyKey,
        referenceType: "BOOKING_SETTLEMENT",
        referenceId: booking.id
      }
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: null,
        businessId: booking.businessId,
        action: "TREASURY_SETTLED",
        targetType: "PLATFORM_WALLET",
        targetId: treasuryWallet.id,
        metadata: { amount: paymentTransaction.credits || paymentTransaction.amount || 0, referenceType: "BOOKING_SETTLEMENT", referenceId: booking.id, markerOnly: true }
      }
    });
  }
}

try {
  const paymentTransactions = await prisma.walletTransaction.findMany({
    where: {
      type: "PAYMENT",
      status: "COMPLETED"
    },
    orderBy: { createdAt: "asc" }
  });

  result.candidates = paymentTransactions.length;

  for (const walletTransaction of paymentTransactions) {
    if (walletTransaction.settledAt) {
      if (!dryRun && walletTransaction.referenceId) {
        const booking = await prisma.booking.findUnique({ where: { id: walletTransaction.referenceId }, select: { id: true, businessId: true } });
        if (booking) {
          await prisma.$transaction((transaction) => ensureHistoricalSettlementMarkers(transaction, booking, walletTransaction));
        }
      }
      skip("already_settled");
      continue;
    }

    if (!walletTransaction.referenceId || !walletTransaction.paymentId) {
      skip("missing_booking_or_payment_reference");
      continue;
    }

    const [booking, payment] = await Promise.all([
      prisma.booking.findUnique({
        where: { id: walletTransaction.referenceId },
        select: { id: true, businessId: true, status: true }
      }),
      prisma.bookingPayment.findUnique({
        where: { id: walletTransaction.paymentId },
        select: { id: true, bookingId: true, status: true }
      })
    ]);

    if (!booking || payment?.bookingId !== booking.id) {
      skip("booking_or_payment_not_found");
      continue;
    }

    if (booking.status !== "COMPLETED") {
      skip("booking_not_completed");
      continue;
    }

    if (payment.status !== "SUCCEEDED") {
      skip("payment_not_succeeded");
      continue;
    }

    if (dryRun) {
      result.settled += 1;
      result.totalAmountMoved += walletTransaction.credits || walletTransaction.amount || 0;
      continue;
    }

    const settlement = await prisma.$transaction((transaction) =>
      settleHistoricalPayment(transaction, booking, walletTransaction)
    );

    if (!settlement.settled) {
      skip(settlement.reason || "settlement_skipped");
      continue;
    }

    result.settled += 1;
    result.totalAmountMoved += settlement.amount;
  }

  console.log(JSON.stringify({
    mode: dryRun ? "DRY_RUN" : "APPLIED",
    ...result
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
