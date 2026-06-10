import { isSuperAdmin } from "@/features/auth/permissions";
import {
  mapOnboardingBusiness,
  onboardingBusinessSelect
} from "@/features/businesses/onboarding-mapper";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();

    if (isSuperAdmin(session.user)) {
      return ok({
        completed: true,
        needsOnboarding: false,
        destination: "/admin",
        business: null
      });
    }

    const business = await prisma.business.findFirst({
      where: {
        ownerId: session.user.id,
        status: {
          not: "ARCHIVED"
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      select: onboardingBusinessSelect
    });

    return ok({
      completed: Boolean(business),
      needsOnboarding: !business,
      destination: business ? "/dashboard" : "/onboarding",
      business: mapOnboardingBusiness(business)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
