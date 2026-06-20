import { AI_GENERATION_TYPES } from "@/features/ai/constants";
import {
  aiGenerationSelect,
  assertAiWriteAccess,
  findTenantAiGeneration,
  getRequestedBusinessId,
  requireAiContext
} from "@/features/ai/server";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const unappliedDraftWhere = {
  OR: [
    {
      appliedAt: null
    },
    {
      appliedAt: {
        isSet: false
      }
    }
  ]
};
const MAX_APPLY_TRANSACTION_ATTEMPTS = 3;

function isTransactionConflict(error) {
  return (
    error?.code === "P2034" ||
    /write conflict|deadlock|transienttransactionerror/i.test(
      error?.message || ""
    )
  );
}

function serializeDraftState(generation) {
  if (!generation) {
    return null;
  }

  return {
    id: generation.id,
    status: generation.status,
    approvalStatus: generation.approvalStatus,
    appliedAt: generation.appliedAt,
    updatedAt: generation.updatedAt,
    outputLength: generation.output?.length || 0,
    serviceId: generation.serviceId
  };
}

function logAiDraftApplyConflict({
  businessId,
  generationId,
  latestGeneration,
  reason,
  userId
}) {
  console.warn("[ai-apply]", {
    event: "draft_apply_conflict",
    businessId,
    generationId,
    userId,
    reason,
    latestGeneration: serializeDraftState(latestGeneration)
  });
}

function logAiDraftApplyRetry({
  attempt,
  businessId,
  error,
  generationId,
  userId
}) {
  console.warn("[ai-apply]", {
    event: "draft_apply_transaction_retry",
    attempt,
    businessId,
    generationId,
    userId,
    code: error?.code || null,
    message: error?.message || "Transaction conflict while applying draft."
  });
}

export function GET() {
  return fail("Apply draft requires a POST request.", 405);
}

export async function POST(request, { params }) {
  try {
    const { user, business } = await requireAiContext(
      getRequestedBusinessId(request)
    );
    assertAiWriteAccess(user, business);
    const { generationId } = await params;
    const generation = await findTenantAiGeneration({
      businessId: business.id,
      generationId
    });

    if (!generation) {
      return fail("AI generation not found.", 404);
    }

    if (
      generation.type !== AI_GENERATION_TYPES.SERVICE_DESCRIPTION ||
      !generation.serviceId
    ) {
      return fail(
        "Only service-description drafts can be applied automatically.",
        422
      );
    }

    if (
      generation.status !== "COMPLETED" ||
      generation.approvalStatus !== "APPROVED" ||
      !generation.output
    ) {
      return fail(
        "Approve this completed draft before applying it.",
        409
      );
    }

    if (generation.appliedAt) {
      return ok({
        generation,
        service: generation.service,
        message: "This draft has already been applied."
      });
    }

    if (generation.output.length > 500) {
      return fail(
        "This draft is longer than the 500-character service description limit.",
        422
      );
    }

    const service = await prisma.service.findFirst({
      where: {
        id: generation.serviceId,
        businessId: business.id
      },
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    if (!service) {
      return fail("The selected service no longer exists.", 404);
    }

    let result;

    for (
      let attempt = 1;
      attempt <= MAX_APPLY_TRANSACTION_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const now = new Date();

        result = await prisma.$transaction(async (transaction) => {
          const generationUpdate = await transaction.aiGeneration.updateMany({
            where: {
              id: generation.id,
              businessId: business.id,
              status: "COMPLETED",
              approvalStatus: "APPROVED",
              ...unappliedDraftWhere
            },
            data: {
              appliedAt: now
            }
          });

          if (generationUpdate.count === 0) {
            const latestGeneration = await transaction.aiGeneration.findFirst({
              where: {
                id: generation.id,
                businessId: business.id
              },
              select: aiGenerationSelect
            });
            const latestService = await transaction.service.findFirst({
              where: {
                id: service.id,
                businessId: business.id
              },
              select: {
                id: true,
                name: true,
                description: true
              }
            });

            if (latestGeneration?.appliedAt) {
              return {
                alreadyApplied: true,
                generation: latestGeneration,
                service: latestService
              };
            }

            logAiDraftApplyConflict({
              businessId: business.id,
              generationId: generation.id,
              latestGeneration,
              reason: latestGeneration
                ? "state_changed_before_apply"
                : "draft_missing_before_apply",
              userId: user.id
            });

            throw new AppError(
              "This draft was updated before it could be applied. Refresh the AI assistant and review the latest draft state.",
              409,
              {
                code: "AI_DRAFT_APPLY_CONFLICT",
                current: serializeDraftState(latestGeneration),
                expected: {
                  status: "COMPLETED",
                  approvalStatus: "APPROVED",
                  appliedAt: null
                }
              }
            );
          }

          const serviceUpdate = await transaction.service.updateMany({
            where: {
              id: service.id,
              businessId: business.id
            },
            data: {
              description: generation.output
            }
          });

          if (serviceUpdate.count === 0) {
            throw new AppError("The selected service no longer exists.", 404);
          }

          await transaction.auditLog.create({
            data: {
              actorUserId: user.id,
              businessId: business.id,
              action: "AI_CONTENT_APPLIED",
              targetType: "AI_GENERATION",
              targetId: generation.id,
              metadata: {
                type: generation.type,
                serviceId: service.id,
                previousDescriptionLength: service.description?.length || 0,
                appliedDescriptionLength: generation.output.length
              }
            }
          });

          const updatedGeneration = await transaction.aiGeneration.findFirst({
            where: {
              id: generation.id,
              businessId: business.id
            },
            select: aiGenerationSelect
          });
          const updatedService = await transaction.service.findFirst({
            where: {
              id: service.id,
              businessId: business.id
            },
            select: {
              id: true,
              name: true,
              description: true
            }
          });

          return {
            generation: updatedGeneration,
            service: updatedService
          };
        });
        break;
      } catch (error) {
        if (
          attempt < MAX_APPLY_TRANSACTION_ATTEMPTS &&
          isTransactionConflict(error)
        ) {
          logAiDraftApplyRetry({
            attempt,
            businessId: business.id,
            error,
            generationId: generation.id,
            userId: user.id
          });
          continue;
        }

        throw error;
      }
    }

    return ok({
      ...result,
      message: result.alreadyApplied
        ? "This draft has already been applied."
        : `Approved draft applied to ${result.service.name}.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
