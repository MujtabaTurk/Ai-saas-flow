import { prisma } from "@/lib/prisma";

const PLATFORM_WALLET_KEY = "PLATFORM";

export async function getPlatformWallet(transaction) {
  return transaction.platformWallet.upsert({
    where: { key: PLATFORM_WALLET_KEY },
    update: {},
    create: { key: PLATFORM_WALLET_KEY }
  });
}

async function writeTreasuryAudit(transaction, { action, targetId, amount, referenceType, referenceId, businessId = null, actorUserId = null }) {
  await transaction.auditLog.create({
    data: {
      actorUserId,
      businessId,
      action,
      targetType: "PLATFORM_WALLET",
      targetId,
      metadata: { amount, referenceType, referenceId }
    }
  });
}

export async function creditPlatformTreasury({ transaction = prisma, amount, referenceType, referenceId, idempotencyKey, businessId = null }) {
  if (!Number.isInteger(amount) || amount <= 0 || !idempotencyKey) return { credited: false, reason: "invalid_treasury_credit" };

  const existing = await transaction.platformWalletTransaction.findUnique({ where: { idempotencyKey } });
  if (existing) return { credited: false, duplicate: true, walletId: existing.platformWalletId };

  const wallet = await getPlatformWallet(transaction);
  await transaction.platformWalletTransaction.create({
    data: {
      platformWalletId: wallet.id,
      type: "CREDIT",
      amount,
      idempotencyKey,
      referenceType,
      referenceId
    }
  });
  await transaction.platformWallet.update({
    where: { id: wallet.id },
    data: {
      totalCollectedCredits: { increment: amount },
      totalPendingLiability: { increment: amount },
      currentTreasuryBalance: { increment: amount }
    }
  });
  await writeTreasuryAudit(transaction, { action: "TREASURY_CREDITED", targetId: wallet.id, amount, referenceType, referenceId, businessId });
  return { credited: true, walletId: wallet.id };
}

export async function settlePlatformTreasury({ transaction, amount, referenceType, referenceId, idempotencyKey, businessId = null }) {
  if (!Number.isInteger(amount) || amount <= 0 || !idempotencyKey) return { settled: false, reason: "invalid_treasury_settlement" };
  const existing = await transaction.platformWalletTransaction.findUnique({ where: { idempotencyKey } });
  if (existing) return { settled: false, duplicate: true };
  const wallet = await getPlatformWallet(transaction);
  const updated = await transaction.platformWallet.updateMany({
    where: { id: wallet.id, totalPendingLiability: { gte: amount } },
    data: {
      totalPendingLiability: { decrement: amount },
      totalAvailableLiability: { increment: amount }
    }
  });
  if (updated.count !== 1) throw new Error("Platform pending liability cannot cover this settlement.");
  await transaction.platformWalletTransaction.create({
    data: { platformWalletId: wallet.id, type: "SETTLEMENT", amount, idempotencyKey, referenceType, referenceId }
  });
  await writeTreasuryAudit(transaction, { action: "TREASURY_SETTLED", targetId: wallet.id, amount, referenceType, referenceId, businessId });
  return { settled: true, walletId: wallet.id };
}

export async function payoutPlatformTreasury({ transaction, amount, referenceType, referenceId, idempotencyKey, businessId = null, actorUserId = null }) {
  if (!Number.isInteger(amount) || amount <= 0 || !idempotencyKey) return { paid: false, reason: "invalid_treasury_payout" };
  const existing = await transaction.platformWalletTransaction.findUnique({ where: { idempotencyKey } });
  if (existing) return { paid: false, duplicate: true };
  const wallet = await getPlatformWallet(transaction);
  const updated = await transaction.platformWallet.updateMany({
    where: { id: wallet.id, currentTreasuryBalance: { gte: amount }, totalAvailableLiability: { gte: amount } },
    data: {
      currentTreasuryBalance: { decrement: amount },
      totalAvailableLiability: { decrement: amount },
      totalPaidOutCredits: { increment: amount }
    }
  });
  if (updated.count !== 1) throw new Error("Platform treasury balance cannot cover this payout.");
  await transaction.platformWalletTransaction.create({
    data: { platformWalletId: wallet.id, type: "PAYOUT", amount, idempotencyKey, referenceType, referenceId }
  });
  await writeTreasuryAudit(transaction, { action: "TREASURY_PAYOUT", targetId: wallet.id, amount, referenceType, referenceId, businessId, actorUserId });
  return { paid: true, walletId: wallet.id };
}

export async function getTreasuryOverview() {
  return getPlatformWallet(prisma);
}
