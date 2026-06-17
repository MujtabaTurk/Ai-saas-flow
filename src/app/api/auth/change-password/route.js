import { changePasswordSchema } from "@/features/auth/validation/change-password-schema";
import {
  hashPassword,
  unusedPasswordResetTokenWhere,
  verifyPassword
} from "@/features/auth/password";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await requireSession();
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(changePasswordSchema, payload || {});

    if (errors) {
      return fail("Please check the password form.", 422, errors);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        passwordHash: true
      }
    });

    if (!user) {
      return fail("User not found.", 404);
    }

    if (!user.passwordHash) {
      return fail(
        "Password changes are only available for email/password accounts.",
        409
      );
    }

    const passwordMatches = await verifyPassword(
      data.currentPassword,
      user.passwordHash
    );

    if (!passwordMatches) {
      return fail("Current password is incorrect.", 401, {
        currentPassword: "Current password is incorrect."
      });
    }

    const passwordHash = await hashPassword(data.newPassword);
    const now = new Date();

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash
      }
    });

    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        ...unusedPasswordResetTokenWhere()
      },
      data: {
        usedAt: now
      }
    });

    return ok({
      message: "Password updated successfully."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
