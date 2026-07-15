import { timingSafeEqual } from "crypto";
import { getCurrentSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/features/auth/permissions";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { hashPassword } from "@/features/auth/password";
import { superAdminSchema } from "@/features/auth/validation/super-admin-schema";
import { created, fail } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateJsonRequest } from "@/lib/api/request";
import { prisma } from "@/lib/prisma";
import { AuditAction, AuditTargetType } from "@prisma/client";

export const runtime = "nodejs";

const BOOTSTRAP_HEADER = "x-super-admin-bootstrap-secret";

function secretsMatch(provided, expected) {
  if (!provided || !expected) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

async function authorizeCreation(request) {
  const session = await getCurrentSession();
  const sessionUser = session?.user;

  if (sessionUser?.id) {
    if (!isSuperAdmin(sessionUser)) {
      return { error: ["Super admin access is required.", 403] };
    }

    return { actorId: sessionUser.id, mode: "SUPER_ADMIN" };
  }

  const bootstrapSecret = process.env.SUPER_ADMIN_BOOTSTRAP_SECRET;
  const providedSecret = request.headers.get(BOOTSTRAP_HEADER);

  if (!secretsMatch(providedSecret, bootstrapSecret)) {
    return { error: ["Super admin setup is not available.", 403] };
  }

  const superAdminCount = await prisma.user.count({
    where: { platformRole: "SUPER_ADMIN" }
  });

  if (superAdminCount > 0) {
    return { error: ["Super admin setup has already been completed.", 403] };
  }

  return { mode: "BOOTSTRAP" };
}

export async function POST(request) {
  try {
    const authorization = await authorizeCreation(request);

    if (authorization.error) {
      return fail(...authorization.error);
    }

    const { data, errors } = await validateJsonRequest(request, superAdminSchema);

    if (errors) {
      return fail("Please check the super admin form.", 422, errors);
    }

    const email = normalizeEmail(data.email);
    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (transaction) => {
      if (authorization.mode === "BOOTSTRAP") {
        const existingSuperAdmin = await transaction.user.findFirst({
          where: { platformRole: "SUPER_ADMIN" },
          select: { id: true }
        });

        if (existingSuperAdmin) {
          const error = new Error("Super admin setup has already been completed.");
          error.statusCode = 403;
          throw error;
        }
      }

      const createdUser = await transaction.user.create({
        data: {
          name: data.name,
          email,
          passwordHash,
          platformRole: "SUPER_ADMIN",
          emailVerified: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          platformRole: true,
          emailVerified: true,
          createdAt: true
        }
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: authorization.actorId || createdUser.id,
          action: AuditAction.SUPER_ADMIN_CREATED,
          targetType: AuditTargetType.USER,
          targetId: createdUser.id,
          reason:
            authorization.mode === "BOOTSTRAP"
              ? "Initial super admin bootstrap"
              : "Created by an existing super admin",
          metadata: {
            email,
            mode: authorization.mode
          }
        }
      });

      return createdUser;
    });

    return created({
      user,
      message: "Super admin created successfully."
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return fail("An account with this email already exists.", 409, {
        email: "An account with this email already exists."
      });
    }

    if (error?.statusCode) {
      return fail(error.message, error.statusCode);
    }

    return handleApiError(error);
  }
}
