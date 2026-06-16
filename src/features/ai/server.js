import {
  assertBusinessManagement,
  assertBusinessWriteAccess,
  isSuperAdmin
} from "@/features/auth/permissions";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import { PLAN_LIMITS } from "@/features/businesses/plan-limits";
import {
  AI_GENERATION_STALE_MINUTES,
  AI_GENERATION_TYPES
} from "@/features/ai/constants";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

const ACTIVE_CREDIT_STATUSES = ["PENDING", "COMPLETED"];

export const aiGenerationSelect = {
  id: true,
  businessId: true,
  createdByUserId: true,
  reviewedByUserId: true,
  serviceId: true,
  type: true,
  status: true,
  approvalStatus: true,
  prompt: true,
  inputContext: true,
  output: true,
  model: true,
  providerResponseId: true,
  inputTokens: true,
  outputTokens: true,
  totalTokens: true,
  estimatedCostMicros: true,
  creditCost: true,
  errorCode: true,
  errorMessage: true,
  approvedAt: true,
  rejectedAt: true,
  appliedAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  service: {
    select: {
      id: true,
      name: true,
      description: true
    }
  }
};

function addUtcMonth(date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      1,
      0,
      0,
      0,
      0
    )
  );
}

function startOfUtcMonth(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)
  );
}

export function getAiPlanPeriod(subscription, now = new Date()) {
  const calendarStart = startOfUtcMonth(now);

  if (subscription?.status === "TRIALING") {
    const start = subscription.currentPeriodStart || subscription.createdAt;
    const end =
      subscription.currentPeriodEnd ||
      subscription.trialEndsAt ||
      addUtcMonth(calendarStart);

    return {
      start: start || calendarStart,
      end
    };
  }

  return {
    start: subscription?.currentPeriodStart || calendarStart,
    end: subscription?.currentPeriodEnd || addUtcMonth(calendarStart)
  };
}

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function requireAiContext(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before using AI assistance.",
      409
    );
  }

  if (!isValidMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBusinessManagement(user, businessId);
  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      name: true,
      description: true,
      industry: true,
      city: true,
      country: true,
      status: true,
      timezone: true,
      currency: true,
      locale: true,
      subscriptions: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        select: {
          id: true,
          planCode: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          trialEndsAt: true,
          createdAt: true
        }
      }
    }
  });

  if (!business) {
    throw new NotFoundError("Business not found.");
  }

  return {
    user,
    business
  };
}

export function assertAiWriteAccess(user, business) {
  assertBusinessWriteAccess(user, business);
}

export function buildAiAccess({ user, business, usage, providerConfigured }) {
  const subscription = business.subscriptions[0] || null;
  const entitlement = getSubscriptionEntitlement(subscription);
  const isReadOnly = business.status !== "ACTIVE" && !isSuperAdmin(user);
  const hasCredits = usage.limit > 0 && usage.remaining > 0;

  return {
    businessStatus: business.status,
    isReadOnly,
    subscriptionEntitled: entitlement.isEntitled,
    entitlementReason: entitlement.reason,
    providerConfigured,
    canGenerate:
      !isReadOnly &&
      entitlement.isEntitled &&
      providerConfigured &&
      hasCredits,
    canReview: !isReadOnly,
    canApply: !isReadOnly
  };
}

export async function expireStaleAiGenerations(businessId, now = new Date()) {
  const staleBefore = new Date(
    now.getTime() - AI_GENERATION_STALE_MINUTES * 60 * 1000
  );

  await prisma.aiGeneration.updateMany({
    where: {
      businessId,
      status: "PENDING",
      createdAt: {
        lt: staleBefore
      }
    },
    data: {
      status: "FAILED",
      errorCode: "STALE_REQUEST",
      errorMessage:
        "The generation did not finish and its reserved credit was released."
    }
  });
}

export async function getAiUsage(business, now = new Date(), client = prisma) {
  const subscription = business.subscriptions[0] || null;
  const planCode = subscription?.planCode || null;
  const limit = PLAN_LIMITS[planCode]?.aiCredits || 0;
  const period = getAiPlanPeriod(subscription, now);
  const where = {
    businessId: business.id,
    createdAt: {
      gte: period.start,
      lt: period.end
    }
  };
  const [completed, pending, failed] = await Promise.all([
    client.aiGeneration.aggregate({
      where: {
        ...where,
        status: "COMPLETED"
      },
      _sum: {
        creditCost: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        estimatedCostMicros: true
      },
      _count: {
        _all: true
      }
    }),
    client.aiGeneration.aggregate({
      where: {
        ...where,
        status: "PENDING"
      },
      _sum: {
        creditCost: true
      },
      _count: {
        _all: true
      }
    }),
    client.aiGeneration.count({
      where: {
        ...where,
        status: "FAILED"
      }
    })
  ]);
  const used = completed._sum.creditCost || 0;
  const reserved = pending._sum.creditCost || 0;
  const estimatedCostMicros = completed._sum.estimatedCostMicros;

  return {
    planCode,
    subscriptionStatus: subscription?.status || null,
    limit,
    used,
    reserved,
    remaining: Math.max(limit - used - reserved, 0),
    completedGenerations: completed._count._all,
    pendingGenerations: pending._count._all,
    failedGenerations: failed,
    inputTokens: completed._sum.inputTokens || 0,
    outputTokens: completed._sum.outputTokens || 0,
    totalTokens: completed._sum.totalTokens || 0,
    estimatedCostMicros:
      estimatedCostMicros === null ? null : estimatedCostMicros,
    estimatedCostUsd:
      estimatedCostMicros === null ? null : estimatedCostMicros / 1_000_000,
    periodStart: period.start,
    periodEnd: period.end
  };
}

function isTransactionConflict(error) {
  return (
    error?.code === "P2034" ||
    /write conflict|transienttransactionerror/i.test(error?.message || "")
  );
}

export async function reserveAiGeneration({
  user,
  business,
  data,
  inputContext,
  model,
  now = new Date()
}) {
  const subscription = business.subscriptions[0] || null;
  const entitlement = getSubscriptionEntitlement(subscription, now);
  const creditLimit = PLAN_LIMITS[subscription?.planCode]?.aiCredits || 0;

  if (!entitlement.isEntitled) {
    throw new AppError(
      "An active subscription is required before using AI assistance.",
      402
    );
  }

  if (creditLimit <= 0) {
    throw new AppError(
      "AI assistance is not included in the current plan.",
      403
    );
  }

  const period = getAiPlanPeriod(subscription, now);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        await transaction.business.update({
          where: {
            id: business.id
          },
          data: {
            updatedAt: now
          },
          select: {
            id: true
          }
        });
        const usage = await transaction.aiGeneration.aggregate({
          where: {
            businessId: business.id,
            status: {
              in: ACTIVE_CREDIT_STATUSES
            },
            createdAt: {
              gte: period.start,
              lt: period.end
            }
          },
          _sum: {
            creditCost: true
          }
        });

        if ((usage._sum.creditCost || 0) >= creditLimit) {
          throw new AppError(
            "Your current plan has reached its AI credit limit.",
            403
          );
        }

        const generation = await transaction.aiGeneration.create({
          data: {
            businessId: business.id,
            createdByUserId: user.id,
            serviceId: data.serviceId || null,
            type: data.type,
            prompt: data.prompt,
            inputContext,
            model,
            creditCost: 1
          },
          select: aiGenerationSelect
        });

        await transaction.auditLog.create({
          data: {
            actorUserId: user.id,
            businessId: business.id,
            action: "AI_GENERATION_REQUESTED",
            targetType: "AI_GENERATION",
            targetId: generation.id,
            metadata: {
              type: data.type,
              model,
              serviceId: data.serviceId || null,
              creditCost: 1
            }
          }
        });

        return generation;
      });
    } catch (error) {
      if (attempt < 3 && isTransactionConflict(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError(
    "AI usage changed while reserving a credit. Please try again.",
    409
  );
}

export async function completeAiGeneration({
  businessId,
  generationId,
  result
}) {
  const update = await prisma.aiGeneration.updateMany({
    where: {
      id: generationId,
      businessId,
      status: "PENDING"
    },
    data: {
      status: "COMPLETED",
      output: result.output,
      model: result.model,
      providerResponseId: result.providerResponseId,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.totalTokens,
      estimatedCostMicros: result.estimatedCostMicros,
      errorCode: null,
      errorMessage: null
    }
  });

  if (update.count === 0) {
    throw new AppError(
      "The AI generation reservation is no longer active.",
      409
    );
  }

  return findTenantAiGeneration({
    businessId,
    generationId
  });
}

export async function failAiGeneration({
  businessId,
  generationId,
  error
}) {
  const providerCode =
    typeof error?.code === "string"
      ? error.code.slice(0, 80)
      : error?.status
        ? `HTTP_${error.status}`
        : "PROVIDER_ERROR";
  const providerMessage =
    error?.details?.providerMessage || error?.message || null;
  const errorMessage =
    typeof providerMessage === "string" && providerMessage.trim()
      ? providerMessage.trim().slice(0, 1000)
      : "The AI provider could not complete this draft.";

  await prisma.aiGeneration.updateMany({
    where: {
      id: generationId,
      businessId,
      status: "PENDING"
    },
    data: {
      status: "FAILED",
      errorCode: providerCode,
      errorMessage
    }
  });
}

export async function findTenantAiGeneration({
  businessId,
  generationId,
  select = aiGenerationSelect
}) {
  if (!isValidMongoObjectId(generationId)) {
    return null;
  }

  return prisma.aiGeneration.findFirst({
    where: {
      id: generationId,
      businessId
    },
    select
  });
}

async function getAggregateBusinessContext(businessId) {
  const [
    bookingGroups,
    serviceCount,
    activeServiceCount,
    customerCount,
    reviewAggregate
  ] = await Promise.all([
    prisma.booking.groupBy({
      by: ["status"],
      where: {
        businessId
      },
      _count: {
        _all: true
      }
    }),
    prisma.service.count({
      where: {
        businessId
      }
    }),
    prisma.service.count({
      where: {
        businessId,
        isActive: true
      }
    }),
    prisma.customer.count({
      where: {
        businessId
      }
    }),
    prisma.review.aggregate({
      where: {
        businessId,
        status: "PUBLISHED"
      },
      _count: {
        _all: true
      },
      _avg: {
        rating: true
      }
    })
  ]);

  return {
    bookingsByStatus: Object.fromEntries(
      bookingGroups.map((group) => [group.status, group._count._all])
    ),
    services: {
      total: serviceCount,
      active: activeServiceCount
    },
    customers: customerCount,
    publishedReviews: reviewAggregate._count._all,
    averagePublishedRating:
      reviewAggregate._avg.rating === null
        ? null
        : Math.round(reviewAggregate._avg.rating * 10) / 10
  };
}

export async function buildAiInputContext({ business, data }) {
  const context = {
    business: {
      name: business.name,
      description: business.description,
      industry: business.industry,
      location: [business.city, business.country].filter(Boolean).join(", "),
      timezone: business.timezone,
      currency: business.currency,
      locale: business.locale
    },
    tone: data.tone
  };

  if (data.serviceId) {
    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        businessId: business.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMin: true,
        priceCents: true,
        currency: true,
        requiresPayment: true,
        isActive: true
      }
    });

    if (!service) {
      throw new NotFoundError("Service not found.");
    }

    context.service = service;
  }

  if (
    [
      AI_GENERATION_TYPES.BUSINESS_SUMMARY,
      AI_GENERATION_TYPES.BUSINESS_INSIGHTS
    ].includes(data.type)
  ) {
    context.aggregateActivity = await getAggregateBusinessContext(business.id);
  }

  if (data.targetLanguage) {
    context.targetLanguage = data.targetLanguage;
  }

  return context;
}
