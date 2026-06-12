import { getAiProviderConfiguration } from "@/features/ai/provider";
import {
  aiGenerationSelect,
  buildAiAccess,
  expireStaleAiGenerations,
  getAiUsage,
  getRequestedBusinessId,
  requireAiContext
} from "@/features/ai/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { user, business } = await requireAiContext(
      getRequestedBusinessId(request)
    );
    await expireStaleAiGenerations(business.id);
    const provider = getAiProviderConfiguration();
    const [generations, services, usage] = await Promise.all([
      prisma.aiGeneration.findMany({
        where: {
          businessId: business.id
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 50,
        select: aiGenerationSelect
      }),
      prisma.service.findMany({
        where: {
          businessId: business.id
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true
        }
      }),
      getAiUsage(business)
    ]);

    return ok({
      generations,
      services,
      usage,
      provider,
      access: buildAiAccess({
        user,
        business,
        usage,
        providerConfigured: provider.configured
      })
    });
  } catch (error) {
    return handleApiError(error);
  }
}
