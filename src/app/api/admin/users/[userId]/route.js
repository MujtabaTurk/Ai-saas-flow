import {
  isAdminRecordId,
  requireSuperAdminContext
} from "@/features/admin/server";
import { userPlatformRoleSchema } from "@/features/admin/validation/admin-schema";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { user: currentUser } = await requireSuperAdminContext();
    const { userId } = await params;

    if (!isAdminRecordId(userId)) {
      return fail("User not found.", 404);
    }

    if (userId === currentUser.id) {
      return fail(
        "You cannot change your own platform role from this screen.",
        409
      );
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      userPlatformRoleSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the platform role update.", 422, errors);
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        platformRole: true
      }
    });

    if (!targetUser) {
      return fail("User not found.", 404);
    }

    if (targetUser.platformRole === data.platformRole) {
      return ok({
        user: targetUser,
        message: "The user already has this platform role."
      });
    }

    if (
      targetUser.platformRole === "SUPER_ADMIN" &&
      data.platformRole !== "SUPER_ADMIN"
    ) {
      const superAdminCount = await prisma.user.count({
        where: {
          platformRole: "SUPER_ADMIN"
        }
      });

      if (superAdminCount <= 1) {
        return fail("The last super admin cannot be demoted.", 409);
      }
    }

    const updatedUser = await prisma.$transaction(async (transaction) => {
      const result = await transaction.user.updateMany({
        where: {
          id: targetUser.id,
          platformRole: targetUser.platformRole
        },
        data: {
          platformRole: data.platformRole
        }
      });

      if (result.count === 0) {
        throw new AppError(
          "This user changed while you were updating them. Refresh and try again.",
          409
        );
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: currentUser.id,
          action: "USER_PLATFORM_ROLE_CHANGED",
          targetType: "USER",
          targetId: targetUser.id,
          reason: data.reason,
          metadata: {
            targetEmail: targetUser.email,
            previousRole: targetUser.platformRole,
            nextRole: data.platformRole
          }
        }
      });

      return transaction.user.findUnique({
        where: {
          id: targetUser.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          platformRole: true,
          updatedAt: true
        }
      });
    });

    return ok({
      user: updatedUser,
      message: `${targetUser.email || targetUser.name || "User"} is now ${data.platformRole.toLowerCase().replaceAll("_", " ")}.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
