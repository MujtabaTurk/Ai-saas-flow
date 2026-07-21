import { performance } from "node:perf_hooks";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const end = new Date();
const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

function dateRange(field) {
  const value = { $convert: { input: `$${field}`, to: "date", onError: null, onNull: null } };
  return { $expr: { $and: [{ $gte: [value, { $dateFromString: { dateString: start.toISOString() } }] }, { $lt: [value, { $dateFromString: { dateString: end.toISOString() } }] }] } };
}

async function aggregate(collection, pipeline) {
  return prisma.$runCommandRaw({ aggregate: collection, pipeline, cursor: {} });
}

try {
  const startedAt = performance.now();
  const [business, revenue, bookings, businessCounts, withdrawalCounts, treasury] = await Promise.all([
    prisma.business.findFirst({ select: { id: true, name: true } }),
    aggregate("BookingPayment", [{ $match: { $and: [{ status: "SUCCEEDED" }, dateRange("paidAt")] } }, { $group: { _id: null, totalRevenue: { $sum: "$amountCents" }, successfulPayments: { $sum: 1 } } }]),
    aggregate("Booking", [{ $match: dateRange("createdAt") }, { $group: { _id: null, totalBookings: { $sum: 1 }, completedBookings: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }, canceledBookings: { $sum: { $cond: [{ $eq: ["$status", "CANCELED"] }, 1, 0] } } } }]),
    aggregate("Business", [{ $facet: { total: [{ $count: "count" }], active: [{ $match: { status: "ACTIVE" } }, { $count: "count" }] } }]),
    aggregate("WithdrawalRequest", [{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$requestedAmount" } } }]),
    prisma.platformWallet.findUnique({ where: { key: "PLATFORM" }, select: { currentTreasuryBalance: true, totalCollectedCredits: true, totalPaidOutCredits: true } })
  ]);
  console.log(JSON.stringify({
    durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
    range: { start, end },
    ownerProof: business,
    revenueAggregation: revenue?.cursor?.firstBatch || [],
    bookingAggregation: bookings?.cursor?.firstBatch || [],
    businessAggregation: businessCounts?.cursor?.firstBatch || [],
    withdrawalAggregation: withdrawalCounts?.cursor?.firstBatch || [],
    treasurySnapshot: treasury
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
