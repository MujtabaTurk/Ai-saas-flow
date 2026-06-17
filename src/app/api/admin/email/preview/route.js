import { requireSuperAdminContext } from "@/features/admin/server";
import { renderTransactionalEmailPreview } from "@/features/notifications/email/service";
import { EMAIL_TEMPLATE_NAMES } from "@/features/notifications/email/templates";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireSuperAdminContext();
    const { searchParams } = new URL(request.url);
    const template = searchParams.get("template") || "password-reset";

    if (!EMAIL_TEMPLATE_NAMES.includes(template)) {
      return fail("Choose a valid email template.", 422, {
        template: `Choose one of: ${EMAIL_TEMPLATE_NAMES.join(", ")}.`
      });
    }

    return ok({
      template,
      availableTemplates: EMAIL_TEMPLATE_NAMES,
      preview: renderTransactionalEmailPreview(template)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
