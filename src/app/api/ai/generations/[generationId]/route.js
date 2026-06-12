import {
  aiGenerationSelect,
  assertAiWriteAccess,
  findTenantAiGeneration,
  getRequestedBusinessId,
  requireAiContext
} from "@/features/ai/server";
import { aiApprovalSchema } from "@/features/ai/validation/ai-schema";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
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

    if (generation.status !== "COMPLETED") {
      return fail("Only completed AI drafts can be reviewed.", 409);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      aiApprovalSchema,
      payload || {}
    );

    if (errors) {
      return fail("Choose a valid review decision.", 422, errors);
    }

    if (generation.appliedAt && data.approvalStatus === "REJECTED") {
      return fail(
        "Applied content cannot be rejected. Update the service directly if it needs revision.",
        409
      );
    }

    if (generation.approvalStatus === data.approvalStatus) {
      return ok({
        generation,
        message: `Draft is already ${data.approvalStatus.toLowerCase()}.`
      });
    }

    const now = new Date();
    const updatedGeneration = await prisma.$transaction(
      async (transaction) => {
        const update = await transaction.aiGeneration.updateMany({
          where: {
            id: generation.id,
            businessId: business.id,
            status: "COMPLETED",
            approvalStatus: generation.approvalStatus
          },
          data: {
            approvalStatus: data.approvalStatus,
            reviewedByUserId: user.id,
            approvedAt:
              data.approvalStatus === "APPROVED" ? now : null,
            rejectedAt:
              data.approvalStatus === "REJECTED" ? now : null
          }
        });

        if (update.count === 0) {
          throw new AppError(
            "This draft changed while it was being reviewed. Refresh and try again.",
            409
          );
        }

        await transaction.auditLog.create({
          data: {
            actorUserId: user.id,
            businessId: business.id,
            action: "AI_GENERATION_REVIEWED",
            targetType: "AI_GENERATION",
            targetId: generation.id,
            metadata: {
              type: generation.type,
              previousApprovalStatus: generation.approvalStatus,
              approvalStatus: data.approvalStatus,
              serviceId: generation.serviceId
            }
          }
        });

        return transaction.aiGeneration.findFirst({
          where: {
            id: generation.id,
            businessId: business.id
          },
          select: aiGenerationSelect
        });
      }
    );

    return ok({
      generation: updatedGeneration,
      message:
        data.approvalStatus === "APPROVED"
          ? "Draft approved. It can now be copied or explicitly applied."
          : "Draft rejected."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
