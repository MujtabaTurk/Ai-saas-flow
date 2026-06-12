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

    const now = new Date();
    const result = await prisma.$transaction(async (transaction) => {
      const generationUpdate = await transaction.aiGeneration.updateMany({
        where: {
          id: generation.id,
          businessId: business.id,
          status: "COMPLETED",
          approvalStatus: "APPROVED",
          appliedAt: null
        },
        data: {
          appliedAt: now
        }
      });

      if (generationUpdate.count === 0) {
        throw new AppError(
          "This draft changed while it was being applied. Refresh and try again.",
          409
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

    return ok({
      ...result,
      message: `Approved draft applied to ${result.service.name}.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
