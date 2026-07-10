import {
  hashPassword,
  hashToken,
  unusedPasswordResetTokenWhere
} from "@/features/auth/password";
import { resetPasswordSchema } from "@/features/auth/validation/reset-password-schema";
import { fail, ok } from "@/lib/api/api-response";
import { validateJsonRequest } from "@/lib/api/request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const INVALID_RESET_LINK_MESSAGE =
  "This reset link is invalid. Please request a new password reset link.";
const EXPIRED_RESET_LINK_MESSAGE =
  "This reset link has expired. Please request a new password reset link.";
const USED_RESET_LINK_MESSAGE =
  "This reset link has already been used. Please request a new password reset link.";
const STALE_RESET_LINK_MESSAGE =
  "This reset link has already been used or expired. Please request a new password reset link.";

export async function POST(request) {
  const { data, errors } = await validateJsonRequest(
    request,
    resetPasswordSchema
  );

  if (errors) {
    return fail("Please check the reset password form.", 422, errors);
  }

  const tokenHash = hashToken(data.token);
  const now = new Date();
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true
    }
  });

  if (!resetToken) {
    return fail(INVALID_RESET_LINK_MESSAGE, 400, {
      token: INVALID_RESET_LINK_MESSAGE
    });
  }

  if (resetToken.usedAt) {
    return fail(USED_RESET_LINK_MESSAGE, 410, {
      token: USED_RESET_LINK_MESSAGE
    });
  }

  if (resetToken.expiresAt <= now) {
    return fail(EXPIRED_RESET_LINK_MESSAGE, 410, {
      token: EXPIRED_RESET_LINK_MESSAGE
    });
  }

  const passwordHash = await hashPassword(data.password);

  const result = await prisma.$transaction(async (transaction) => {
    const consumedToken = await transaction.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        expiresAt: {
          gt: now
        },
        ...unusedPasswordResetTokenWhere()
      },
      data: {
        usedAt: now
      }
    });

    if (consumedToken.count !== 1) {
      return {
        consumed: false
      };
    }

    await transaction.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    });

    await transaction.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        id: {
          not: resetToken.id
        },
        ...unusedPasswordResetTokenWhere()
      },
      data: { usedAt: now }
    });

    return {
      consumed: true
    };
  });

  if (!result.consumed) {
    return fail(STALE_RESET_LINK_MESSAGE, 409, {
      token: STALE_RESET_LINK_MESSAGE
    });
  }

  return ok({
    message: "Password updated successfully. You can now sign in."
  });
}
