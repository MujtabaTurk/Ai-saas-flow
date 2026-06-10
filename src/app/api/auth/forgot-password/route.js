import { appConfig } from "@/config/app";
import { forgotPasswordSchema } from "@/features/auth/validation/forgot-password-schema";
import { createPasswordResetToken } from "@/features/auth/password";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { ok, fail } from "@/lib/api/api-response";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const { data, errors } = await validateRequest(forgotPasswordSchema, payload || {});

  if (errors) {
    return fail("Please enter a valid email address.", 422, errors);
  }

  const email = normalizeEmail(data.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  const response = {
    message: "If an account exists for that email, a password reset link has been prepared."
  };

  if (!user) {
    return ok(response);
  }

  const { token, tokenHash } = createPasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  if (process.env.NODE_ENV !== "production") {
    response.devResetUrl = `${appConfig.url}/reset-password?token=${token}`;
  }

  return ok(response);
}

