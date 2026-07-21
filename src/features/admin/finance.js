import { prisma } from "@/lib/prisma";
import { getTreasuryOverview } from "@/features/wallet/treasury";

function monthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

export async function getFinanceOverview() {
  const [wallets, requests, successfulPayments, treasury] = await Promise.all([
    prisma.wallet.findMany({
      select: {
        businessId: true,
        pendingCredits: true,
        availableCredits: true,
        holdCredits: true,
        withdrawnCredits: true,
        lifetimeCredits: true,
        monthlyRevenue: true,
        business: { select: { id: true, name: true } }
      }
    }),
    prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.bookingPayment.findMany({
      where: { status: "SUCCEEDED" },
      select: {
        amountCents: true,
        paidAt: true,
        createdAt: true,
        business: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "asc" }
    }),
    getTreasuryOverview()
  ]);

  const revenueByMonth = new Map();
  const revenueByBusiness = new Map();
  for (const payment of successfulPayments) {
    const amount = payment.amountCents || 0;
    const month = monthKey(payment.paidAt || payment.createdAt);
    revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + amount);
    const businessId = payment.business.id;
    const current = revenueByBusiness.get(businessId) || { businessId, businessName: payment.business.name, amount: 0 };
    current.amount += amount;
    revenueByBusiness.set(businessId, current);
  }

  const pendingWithdrawals = sum(requests.filter((request) => request.status === "PENDING").map((request) => request.requestedAmount));
  const paidWithdrawals = sum(requests.filter((request) => request.status === "PAID").map((request) => request.requestedAmount));
  const pendingCredits = sum(wallets.map((wallet) => wallet.pendingCredits));
  const availableCredits = sum(wallets.map((wallet) => wallet.availableCredits));
  const holdCredits = sum(wallets.map((wallet) => wallet.holdCredits));
  const withdrawnCredits = sum(wallets.map((wallet) => wallet.withdrawnCredits));

  return {
    overview: {
      treasury: treasury || {
        currentTreasuryBalance: 0,
        totalCollectedCredits: 0,
        totalPendingLiability: 0,
        totalAvailableLiability: 0,
        totalPaidOutCredits: 0
      },
      totalPlatformRevenue: sum(successfulPayments.map((payment) => payment.amountCents)),
      totalPendingCredits: pendingCredits,
      totalAvailableCredits: availableCredits,
      totalWithdrawnCredits: withdrawnCredits,
      totalOutstandingLiability: pendingCredits + availableCredits + holdCredits,
      pendingWithdrawalAmount: pendingWithdrawals,
      paidWithdrawalAmount: paidWithdrawals
    },
    successfulPaymentCount: successfulPayments.length,
    revenueByMonth: [...revenueByMonth.entries()].map(([month, amount]) => ({ month, amount })),
    revenueByBusiness: [...revenueByBusiness.values()].sort((a, b) => b.amount - a.amount),
    pendingWithdrawalAmounts: requests.filter((request) => request.status === "PENDING").map((request) => ({ businessName: request.business.name, amount: request.requestedAmount })),
    paidWithdrawalAmounts: requests.filter((request) => request.status === "PAID").map((request) => ({ businessName: request.business.name, amount: request.requestedAmount })),
    requests: requests.map((request) => ({
      id: request.id,
      businessId: request.businessId,
      businessName: request.business.name,
      requestedAmount: request.requestedAmount,
      status: request.status,
      notes: request.notes,
      createdAt: request.createdAt,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      paidAt: request.paidAt,
      processedBy: request.processedBy ? { id: request.processedBy.id, name: request.processedBy.name, email: request.processedBy.email } : null
    }))
  };
}

export function filterFinanceRequests(requests, status) {
  return status && status !== "ALL" ? requests.filter((request) => request.status === status) : requests;
}

export function toFinanceExportRows(report, finance) {
  if (report === "revenue") {
    return finance.revenueByMonth.map((row) => ({ Month: row.month, Revenue: row.amount }));
  }
  return finance.requests.map((request) => ({
    Business: request.businessName,
    Amount: request.requestedAmount,
    Status: request.status,
    "Request Date": request.createdAt,
    "Approval Date": request.approvedAt || "",
    "Paid Date": request.paidAt || "",
    "Processed By": request.processedBy?.name || request.processedBy?.email || ""
  }));
}
