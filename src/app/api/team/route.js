import {
  getRequestedBusinessId,
  getTeamSnapshot,
  requireTeamContext
} from "@/features/team/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { user, business } = await requireTeamContext(
      getRequestedBusinessId(request)
    );

    return ok(await getTeamSnapshot({ user, business }));
  } catch (error) {
    return handleApiError(error);
  }
}
