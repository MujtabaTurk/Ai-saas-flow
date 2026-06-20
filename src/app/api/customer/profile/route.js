import {
  getCustomerProfile,
  updateCustomerProfile
} from "@/features/customer-portal/server";
import { customerProfileSchema } from "@/features/customer-portal/validation/customer-portal-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok(await getCustomerProfile());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request) {
  try {
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerProfileSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check your profile details.", 422, errors);
    }

    return ok(await updateCustomerProfile(data));
  } catch (error) {
    return handleApiError(error);
  }
}
