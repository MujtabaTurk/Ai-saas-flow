import { getAuthorizationSummary } from "@/features/auth/permissions";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { requireSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();

    return ok({
      user: session.user,
      authorization: getAuthorizationSummary(session.user)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
