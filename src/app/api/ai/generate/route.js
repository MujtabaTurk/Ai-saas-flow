import { buildAiPrompt } from "@/features/ai/prompts";
import {
  generateAiDraft,
  getAiProviderConfiguration
} from "@/features/ai/provider";
import {
  assertAiWriteAccess,
  buildAiInputContext,
  completeAiGeneration,
  expireStaleAiGenerations,
  failAiGeneration,
  getAiUsage,
  getRequestedBusinessId,
  requireAiContext,
  reserveAiGeneration
} from "@/features/ai/server";
import { aiGenerationSchema } from "@/features/ai/validation/ai-schema";
import { created, fail } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";
export const maxDuration = 60;

function logAiGenerationFailure({ error, user, business, generationId }) {
  const status = error?.status || 500;
  const logger = status >= 500 ? console.error : console.warn;

  logger("[ai-generation]", {
    event: "generation_failed",
    status,
    code: error?.code || error?.details?.code || null,
    businessId: business?.id || null,
    userId: user?.id || null,
    generationId: generationId || null,
    message: error?.message || "Unknown AI generation error.",
    details: error?.details || null
  });
}

export async function POST(request) {
  let reservation = null;

  try {
    const { user, business } = await requireAiContext(
      getRequestedBusinessId(request)
    );
    assertAiWriteAccess(user, business);
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      aiGenerationSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the AI request.", 422, errors);
    }

    const normalizedData = {
      ...data,
      serviceId:
        data.type === "SERVICE_DESCRIPTION" ? data.serviceId : null,
      targetLanguage:
        data.type === "TRANSLATION" ? data.targetLanguage : null
    };
    const provider = getAiProviderConfiguration();

    if (!provider.configured) {
      throw new AppError(provider.configurationMessage, 503);
    }

    await expireStaleAiGenerations(business.id);
    const inputContext = await buildAiInputContext({
      business,
      data: normalizedData
    });
    const prompt = buildAiPrompt({
      ...normalizedData,
      inputContext
    });
    reservation = await reserveAiGeneration({
      user,
      business,
      data: normalizedData,
      inputContext,
      model: provider.model
    });

    let result;

    try {
      result = await generateAiDraft({
        ...prompt,
        businessId: business.id,
        generationId: reservation.id,
        userId: user.id
      });
    } catch (error) {
      await failAiGeneration({
        businessId: business.id,
        generationId: reservation.id,
        error
      });

      logAiGenerationFailure({
        error,
        user,
        business,
        generationId: reservation.id
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        error?.message ||
          "The AI provider could not generate a draft. Please try again.",
        error?.status || 502,
        {
          code: error?.code || "AI_PROVIDER_ERROR"
        }
      );
    }

    const generation = await completeAiGeneration({
      businessId: business.id,
      generationId: reservation.id,
      result
    });
    const usage = await getAiUsage(business);

    return created({
      generation,
      usage,
      message:
        "Draft generated. Review and approve it before copying or applying it."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
