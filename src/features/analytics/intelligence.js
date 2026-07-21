import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function facetResult(result) {
  return result?.cursor?.firstBatch?.[0] || {};
}

async function aggregate(collection, pipeline) {
  const result = await prisma.$runCommandRaw({
    aggregate: collection,
    pipeline,
    cursor: {}
  });
  return result?.cursor?.firstBatch || [];
}

function businessMatch(businessId) {
  return {
    $expr: { $eq: ["$businessId", { $toObjectId: businessId }] }
  };
}

function dateRangeMatch(field, start, end) {
  const value = { $convert: { input: `$${field}`, to: "date", onError: null, onNull: null } };
  return {
    $expr: {
      $and: [
        { $gte: [value, { $dateFromString: { dateString: start.toISOString() } }] },
        { $lt: [value, { $dateFromString: { dateString: end.toISOString() } }] }
      ]
    }
  };
}

function andMatch(...matches) {
  return { $and: matches };
}

function revenueFacets(match, timezone) {
  const bucket = (format) => [
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format, date: "$paidAt", timezone } },
        amount: { $sum: "$amountCents" },
        payments: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];
  return {
    daily: bucket("%Y-%m-%d"),
    weekly: bucket("%G-W%V"),
    monthly: bucket("%Y-%m"),
    yearly: bucket("%Y")
  };
}

function normalizeSeries(rows, label = "_id") {
  return rows.map((row) => ({
    label: row[label],
    amount: row.amount || 0,
    bookings: row.bookings || 0,
    customers: row.customers || 0,
    completed: row.completed || 0,
    canceled: row.canceled || 0
  }));
}

async function computeBusinessIntelligence({ businessId, timezone, start, end }) {
  const bookingMatch = andMatch(businessMatch(businessId), dateRangeMatch("startsAt", start, end));
  const paymentMatch = andMatch(businessMatch(businessId), { status: "SUCCEEDED" }, dateRangeMatch("paidAt", start, end));
  const customerMatch = andMatch(businessMatch(businessId), dateRangeMatch("createdAt", start, end));

  const [bookingSummary, revenue, bookingTrend, servicePerformance, customerSummary, customerTrend, customerBehavior, returningCustomerSummary, wallet, services] = await Promise.all([
    aggregate("Booking", [{ $match: bookingMatch }, { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }, canceled: { $sum: { $cond: [{ $eq: ["$status", "CANCELED"] }, 1, 0] } } } }]),
    aggregate("BookingPayment", [{ $facet: { summary: [{ $match: paymentMatch }, { $group: { _id: null, total: { $sum: "$amountCents" }, payments: { $sum: 1 } } }], ...revenueFacets(paymentMatch, timezone) } }]),
    aggregate("Booking", [{ $match: bookingMatch }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$startsAt", timezone } }, bookings: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }, canceled: { $sum: { $cond: [{ $eq: ["$status", "CANCELED"] }, 1, 0] } } } }, { $sort: { _id: 1 } }]),
    aggregate("BookingPayment", [{ $match: paymentMatch }, { $lookup: { from: "Booking", localField: "bookingId", foreignField: "_id", as: "booking" } }, { $unwind: "$booking" }, { $group: { _id: { serviceId: "$booking.serviceId", name: "$booking.serviceNameSnapshot" }, bookings: { $sum: 1 }, revenue: { $sum: "$amountCents" }, completed: { $sum: { $cond: [{ $eq: ["$booking.status", "COMPLETED"] }, 1, 0] } } } }, { $sort: { revenue: -1 } }, { $limit: 10 }]),
    aggregate("Customer", [{ $match: customerMatch }, { $group: { _id: null, newCustomers: { $sum: 1 } } }]),
    aggregate("Customer", [{ $match: businessMatch(businessId) }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone } }, customers: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    aggregate("Booking", [{ $match: bookingMatch }, { $group: { _id: "$customerId", bookings: { $sum: 1 }, revenue: { $sum: "$servicePriceCentsSnapshot" } } }, { $sort: { bookings: -1, revenue: -1 } }, { $limit: 10 }, { $lookup: { from: "Customer", localField: "_id", foreignField: "_id", as: "customer" } }, { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } }]),
    aggregate("Booking", [{ $match: bookingMatch }, { $group: { _id: "$customerId", bookings: { $sum: 1 } } }, { $match: { bookings: { $gt: 1 } } }, { $count: "returningCustomers" }]),
    prisma.wallet.findUnique({ where: { businessId }, select: { pendingCredits: true, availableCredits: true, withdrawnCredits: true, lifetimeCredits: true } }),
    prisma.service.count({ where: { businessId } })
  ]);

  const summary = facetResult(bookingSummary);
  const paymentFacets = facetResult(revenue);
  const booking = summary;
  const totalBookings = booking.total || 0;

  return {
    generatedAt: new Date(),
    scope: "BUSINESS",
    period: { start, end },
    cards: {
      totalRevenue: paymentFacets.summary?.[0]?.total || 0,
      monthlyRevenue: paymentFacets.monthly?.slice(-1)[0]?.amount || 0,
      pendingCredits: wallet?.pendingCredits || 0,
      availableCredits: wallet?.availableCredits || 0,
      withdrawnCredits: wallet?.withdrawnCredits || 0,
      totalServices: services,
      totalBookings,
      completedBookings: booking.completed || 0
    },
    bookingAnalytics: {
      total: totalBookings,
      completed: booking.completed || 0,
      canceled: booking.canceled || 0,
      completionRate: totalBookings ? Math.round(((booking.completed || 0) / totalBookings) * 1000) / 10 : 0,
      cancellationRate: totalBookings ? Math.round(((booking.canceled || 0) / totalBookings) * 1000) / 10 : 0
    },
    revenue: {
      daily: normalizeSeries(paymentFacets.daily || []),
      weekly: normalizeSeries(paymentFacets.weekly || []),
      monthly: normalizeSeries(paymentFacets.monthly || []),
      yearly: normalizeSeries(paymentFacets.yearly || [])
    },
    bookings: normalizeSeries(bookingTrend),
    services: servicePerformance.map((row) => ({ serviceId: row._id.serviceId, name: row._id.name, bookings: row.bookings, revenue: row.revenue, completed: row.completed })),
    customers: {
      newCustomers: customerSummary[0]?.newCustomers || 0,
      returningCustomers: returningCustomerSummary[0]?.returningCustomers || 0,
      growth: customerTrend.map((row) => ({ label: row._id, customers: row.customers })),
      topCustomers: customerBehavior.map((row) => ({ customerId: row._id, name: row.customer?.name || "Customer", bookings: row.bookings, revenue: row.revenue }))
    },
    empty: totalBookings === 0 && !paymentFacets.summary?.[0]
  };
}

async function computePlatformIntelligence({ timezone, start, end }) {
  const paymentMatch = { status: "SUCCEEDED", ...dateRangeMatch("paidAt", start, end) };
  const bookingMatch = dateRangeMatch("createdAt", start, end);
  const businessMatchRange = dateRangeMatch("createdAt", start, end);
  const [revenue, bookings, businesses, withdrawals, treasury, topRevenueBusinesses, topGrowingBusinesses] = await Promise.all([
    aggregate("BookingPayment", [{ $facet: { summary: [{ $match: paymentMatch }, { $group: { _id: null, total: { $sum: "$amountCents" }, payments: { $sum: 1 } } }], ...revenueFacets(paymentMatch, timezone) } }]),
    aggregate("Booking", [{ $match: bookingMatch }, { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }, canceled: { $sum: { $cond: [{ $eq: ["$status", "CANCELED"] }, 1, 0] } } } }]),
    aggregate("Business", [{ $facet: { total: [{ $count: "count" }], active: [{ $match: { status: "ACTIVE" } }, { $count: "count" }], growth: [{ $match: businessMatchRange }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone } }, businesses: { $sum: 1 } } }, { $sort: { _id: 1 } }] } }]),
    aggregate("WithdrawalRequest", [{ $match: dateRangeMatch("createdAt", start, end) }, { $group: { _id: "$status", requests: { $sum: 1 }, amount: { $sum: "$requestedAmount" } } }]),
    prisma.platformWallet.findUnique({ where: { key: "PLATFORM" }, select: { currentTreasuryBalance: true, totalCollectedCredits: true, totalPaidOutCredits: true } }),
    aggregate("BookingPayment", [{ $match: paymentMatch }, { $group: { _id: "$businessId", revenue: { $sum: "$amountCents" } } }, { $sort: { revenue: -1 } }, { $limit: 10 }, { $lookup: { from: "Business", localField: "_id", foreignField: "_id", as: "business" } }, { $unwind: { path: "$business", preserveNullAndEmptyArrays: true } }]),
    aggregate("Business", [{ $match: businessMatchRange }, { $sort: { createdAt: -1 } }, { $limit: 10 }, { $project: { _id: 1, name: 1, createdAt: 1 } }])
  ]);
  const revenueFaceted = facetResult(revenue);
  const booking = bookings[0] || {};
  const businessFaceted = facetResult(businesses);
  const withdrawalMap = Object.fromEntries(withdrawals.map((row) => [row._id, row]));
  return {
    generatedAt: new Date(), scope: "PLATFORM", period: { start, end },
    cards: {
      totalPlatformRevenue: revenueFaceted.summary?.[0]?.total || 0,
      monthlyRevenue: revenueFaceted.monthly?.slice(-1)[0]?.amount || 0,
      totalBusinesses: businessFaceted.total?.[0]?.count || 0,
      activeBusinesses: businessFaceted.active?.[0]?.count || 0,
      totalBookings: booking.total || 0,
      completedBookings: booking.completed || 0,
      pendingWithdrawals: withdrawalMap.PENDING?.requests || 0,
      treasuryBalance: treasury?.currentTreasuryBalance || 0
    },
    bookingAnalytics: { total: booking.total || 0, completed: booking.completed || 0, canceled: booking.canceled || 0 },
    withdrawalAnalytics: withdrawalMap,
    revenue: { daily: normalizeSeries(revenueFaceted.daily || []), weekly: normalizeSeries(revenueFaceted.weekly || []), monthly: normalizeSeries(revenueFaceted.monthly || []), yearly: normalizeSeries(revenueFaceted.yearly || []) },
    businessGrowth: businessFaceted.growth || [],
    topRevenueBusinesses: topRevenueBusinesses.map((row) => ({ businessId: row._id, name: row.business?.name || "Business", revenue: row.revenue })),
    topGrowingBusinesses: topGrowingBusinesses.map((row) => ({ businessId: row._id, name: row.name, createdAt: row.createdAt })),
    empty: !revenueFaceted.summary?.[0] && !booking.total
  };
}

export function getAnalyticsRange({ days = 30, now = new Date() } = {}) {
  const end = new Date(now);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function getBusinessIntelligence(args) {
  const { businessId, start, end } = args;
  return unstable_cache(
    () => computeBusinessIntelligence(args),
    ["business-intelligence", businessId, start.toISOString(), end.toISOString()],
    { revalidate: 30 }
  )();
}

export async function getPlatformIntelligence(args) {
  const { start, end } = args;
  return unstable_cache(
    () => computePlatformIntelligence(args),
    ["platform-intelligence", start.toISOString(), end.toISOString()],
    { revalidate: 30 }
  )();
}
