import {
  isReservedBusinessSlug,
  isValidBusinessSlug,
  normalizeBusinessSlug
} from "@/features/businesses/slug";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const slug = normalizeBusinessSlug(searchParams.get("slug"));

    if (!slug || !isValidBusinessSlug(slug)) {
      return fail("Enter a valid slug.", 422, {
        slug: "Use 3-50 lowercase letters, numbers, and hyphens."
      });
    }

    if (isReservedBusinessSlug(slug)) {
      return fail("This public slug is reserved by ServiceFlow.", 409, {
        slug: "Choose a different public slug."
      });
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true
      }
    });

    return ok({
      slug,
      available: !existingBusiness
    });
  } catch (error) {
    return handleApiError(error);
  }
}
