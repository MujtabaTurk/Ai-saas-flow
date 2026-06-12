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
      throw new AppError(
        "AI generation is not configured. Add OPENAI_API_KEY to the server environment.",
        503
      );
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
        generationId: reservation.id
      });
    } catch (error) {
      await failAiGeneration({
        businessId: business.id,
        generationId: reservation.id,
        error
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        error?.status === 429
          ? "The AI provider is busy or rate-limited. Please try again shortly."
          : "The AI provider could not generate a draft. Please try again.",
        error?.status === 429 ? 429 : 502
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
