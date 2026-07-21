import { isBusinessOwner, isSuperAdmin } from "@/features/auth/permissions";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { payoutPlatformTreasury } from "@/features/wallet/treasury";

const AUDIT_TARGET = "WITHDRAWAL_REQUEST";

function auditAction(status) {
  return `WITHDRAWAL_REQUEST_${status}`;
}

function serializeWithdrawal(request) {
  return {
    id: request.id,
    businessId: request.businessId,
    walletId: request.walletId,
    requestedAmount: request.requestedAmount,
    status: request.status,
    notes: request.notes,
    createdAt: request.createdAt,
    approvedAt: request.approvedAt,
    rejectedAt: request.rejectedAt,
    paidAt: request.paidAt,
    processedByUserId: request.processedByUserId,
    business: request.business
      ? { id: request.business.id, name: request.business.name }
      : undefined
  };
}

function assertPositiveAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new AppError("Withdrawal amount must be greater than zero.", 422);
  }
}

async function createAudit(transaction, { action, request, actorUserId, metadata }) {
  await transaction.auditLog.create({
    data: {
      actorUserId,
      businessId: request.businessId,
      action,
      targetType: AUDIT_TARGET,
      targetId: request.id,
      metadata
    }
  });
}

export async function createWithdrawalRequest({
  user,
  requestedAmount,
  notes,
  idempotencyKey
}) {
  if (!isBusinessOwner(user)) {
    throw new ForbiddenError("Only business owners can request withdrawals.");
  }
  assertPositiveAmount(requestedAmount);
  if (!idempotencyKey) {
    throw new AppError("A withdrawal request identifier is required.", 422);
  }

  const business = await prisma.business.findUnique({
    where: { id: user.activeBusinessId },
    select: { id: true, ownerId: true, name: true }
  });
  if (!business || business.ownerId !== user.id) {
    throw new ForbiddenError("You cannot request withdrawals for this business.");
  }

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.withdrawalRequest.findUnique({
      where: { idempotencyKey },
      include: { business: { select: { id: true, name: true } } }
    });
    if (existing) {
      return serializeWithdrawal(existing);
    }

    const wallet = await transaction.wallet.findUnique({
      where: { businessId: business.id }
    });
    if (!wallet) {
      throw new AppError("Wallet is not available for this business.", 409);
    }

    // Normalize legacy wallets whose holdCredits field was stored as null
    // before the withdrawal reservation field existed.
    if (wallet.holdCredits === 0) {
      await transaction.wallet.updateMany({
        where: { id: wallet.id },
        data: { holdCredits: 0 }
      });
    }

    const balanceUpdate = await transaction.wallet.updateMany({
      where: {
        id: wallet.id,
        availableCredits: { gte: requestedAmount }
      },
      data: {
        availableCredits: { decrement: requestedAmount },
        holdCredits: { increment: requestedAmount }
      }
    });
    if (balanceUpdate.count !== 1) {
      throw new AppError("Withdrawal amount exceeds available credits.", 409);
    }

    const request = await transaction.withdrawalRequest.create({
      data: {
        businessId: business.id,
        walletId: wallet.id,
        requestedAmount,
        notes: notes?.trim() || null,
        idempotencyKey
      },
      include: { business: { select: { id: true, name: true } } }
    });
    await createAudit(transaction, {
      action: auditAction("CREATED"),
      request,
      actorUserId: user.id,
      metadata: { requestedAmount }
    });

    return serializeWithdrawal(request);
  });
}

export async function getBusinessWithdrawalRequests(user) {
  if (!isBusinessOwner(user)) {
    throw new ForbiddenError("Only business owners can view withdrawals.");
  }

  const requests = await prisma.withdrawalRequest.findMany({
    where: { businessId: user.activeBusinessId },
    orderBy: { createdAt: "desc" },
    include: { business: { select: { id: true, name: true } } }
  });
  return requests.map(serializeWithdrawal);
}

export async function getAdminWithdrawalRequests({ status } = {}) {
  const requests = await prisma.withdrawalRequest.findMany({
    where: status && status !== "ALL" ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { business: { select: { id: true, name: true } } }
  });
  return requests.map(serializeWithdrawal);
}

async function getRequestForAction(transaction, requestId) {
  const request = await transaction.withdrawalRequest.findUnique({
    where: { id: requestId },
    include: { business: { select: { id: true, name: true } } }
  });
  if (!request) {
    throw new NotFoundError("Withdrawal request not found.");
  }
  return request;
}

async function releaseWithdrawalHold(transaction, request) {
  const standardRelease = await transaction.wallet.updateMany({
    where: {
      id: request.walletId,
      holdCredits: { gte: request.requestedAmount }
    },
    data: {
      holdCredits: { decrement: request.requestedAmount },
      availableCredits: { increment: request.requestedAmount }
    }
  });

  if (standardRelease.count === 1) {
    return { recovered: false };
  }

  // Older requests can exist without the hold reservation being persisted.
  // They are still safe to release exactly once while they remain PENDING.
  const wallet = await transaction.wallet.findUnique({
    where: { id: request.walletId },
    select: { holdCredits: true }
  });
  const legacyRecovery = wallet?.holdCredits === 0
    ? await transaction.wallet.updateMany({
      where: { id: request.walletId },
      data: {
        holdCredits: 0,
        availableCredits: { increment: request.requestedAmount }
      }
    })
    : { count: 0 };

  if (legacyRecovery.count === 1) {
    console.warn(JSON.stringify({
      event: "WITHDRAWAL_HOLD_RECOVERED",
      requestId: request.id,
      walletId: request.walletId,
      amount: request.requestedAmount
    }));
    return { recovered: true };
  }

  throw new AppError("Wallet hold does not cover this withdrawal.", 409);
}

export async function processWithdrawalRequest({
  user,
  requestId,
  action,
  notes
}) {
  if (!isSuperAdmin(user)) {
    throw new ForbiddenError("Only super admins can process withdrawals.");
  }
  if (!["APPROVE", "REJECT", "PAID"].includes(action)) {
    throw new AppError("Choose a valid withdrawal action.", 422);
  }

  return prisma.$transaction(async (transaction) => {
    const request = await getRequestForAction(transaction, requestId);
    const now = new Date();

    if (action === "APPROVE") {
      if (request.status !== "PENDING") {
        throw new AppError("Only pending withdrawals can be approved.", 409);
      }
      const updated = await transaction.withdrawalRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          approvedAt: now,
          processedByUserId: user.id,
          notes: notes?.trim() || request.notes
        },
        include: { business: { select: { id: true, name: true } } }
      });
      await createAudit(transaction, {
        action: auditAction("APPROVED"),
        request: updated,
        actorUserId: user.id,
        metadata: { requestedAmount: updated.requestedAmount }
      });
      return serializeWithdrawal(updated);
    }

    if (action === "REJECT") {
      if (request.status !== "PENDING") {
        throw new AppError("This withdrawal cannot be rejected.", 409);
      }
      await releaseWithdrawalHold(transaction, request);
      const updated = await transaction.withdrawalRequest.update({
        where: { id: request.id },
        data: {
          status: "REJECTED",
          rejectedAt: now,
          processedByUserId: user.id,
          notes: notes?.trim() || request.notes
        },
        include: { business: { select: { id: true, name: true } } }
      });
      await createAudit(transaction, {
        action: auditAction("REJECTED"),
        request: updated,
        actorUserId: user.id,
        metadata: { requestedAmount: updated.requestedAmount }
      });
      return serializeWithdrawal(updated);
    }

    if (request.status !== "APPROVED") {
      throw new AppError("Only approved withdrawals can be marked paid.", 409);
    }
    const walletUpdate = await transaction.wallet.updateMany({
      where: { id: request.walletId, holdCredits: { gte: request.requestedAmount } },
      data: {
        holdCredits: { decrement: request.requestedAmount },
        withdrawnCredits: { increment: request.requestedAmount }
      }
    });
    if (walletUpdate.count !== 1) {
      throw new AppError("Wallet hold does not cover this withdrawal.", 409);
    }
    await payoutPlatformTreasury({
      transaction,
      amount: request.requestedAmount,
      referenceType: "WITHDRAWAL_REQUEST",
      referenceId: request.id,
      idempotencyKey: `PAYOUT:${request.id}`,
      businessId: request.businessId,
      actorUserId: user.id
    });
    const updated = await transaction.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: "PAID",
        paidAt: now,
        processedByUserId: user.id,
        notes: notes?.trim() || request.notes
      },
      include: { business: { select: { id: true, name: true } } }
    });
    await createAudit(transaction, {
      action: auditAction("PAID"),
      request: updated,
      actorUserId: user.id,
      metadata: { requestedAmount: updated.requestedAmount }
    });
    return serializeWithdrawal(updated);
  });
}
