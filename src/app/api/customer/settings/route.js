import {
  getCustomerSettings,
  updateCustomerSettings
} from "@/features/customer-portal/server";
import { customerSettingsSchema } from "@/features/customer-portal/validation/customer-portal-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok(await getCustomerSettings());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request) {
  try {
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerSettingsSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check your settings.", 422, errors);
    }

    return ok(await updateCustomerSettings(data));
  } catch (error) {
    return handleApiError(error);
  }
}
