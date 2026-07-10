import * as Yup from "yup";
import { consumeEmailVerificationToken } from "@/features/auth/email-verification";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateJsonRequest } from "@/lib/api/request";

export const runtime = "nodejs";

const verifyEmailSchema = Yup.object({
  token: Yup.string().trim().required("Verification token is required.")
});

export async function POST(request) {
  try {
    const { data, errors } = await validateJsonRequest(
      request,
      verifyEmailSchema
    );

    if (errors) {
      return fail("Please use a valid verification link.", 422, errors);
    }

    const result = await consumeEmailVerificationToken(data.token);

    return ok({
      ...result,
      message: "Email verified successfully."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
