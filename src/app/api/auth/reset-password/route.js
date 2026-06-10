import { hashPassword, hashToken } from "@/features/auth/password";
import { resetPasswordSchema } from "@/features/auth/validation/reset-password-schema";
import { fail, ok } from "@/lib/api/api-response";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const { data, errors } = await validateRequest(resetPasswordSchema, payload || {});

  if (errors) {
    return fail("Please check the reset password form.", 422, errors);
  }

  const tokenHash = hashToken(data.token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (!resetToken) {
    return fail("This reset link is invalid or has expired.", 400);
  }

  const passwordHash = await hashPassword(data.password);
  const now = new Date();

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash }
  });

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: resetToken.userId,
      usedAt: null
    },
    data: { usedAt: now }
  });

  return ok({
    message: "Password updated successfully. You can now sign in."
  });
}
