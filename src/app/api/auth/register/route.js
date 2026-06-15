import { created, fail } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { hashPassword } from "@/features/auth/password";
import { registerSchema } from "@/features/auth/validation/register-schema";
import {
  expireTeamInvitationIfNeeded,
  findTeamInvitationByToken
} from "@/features/team/invitation-access";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(registerSchema, payload || {});

    if (errors) {
      return fail("Please check the registration form.", 422, errors);
    }

    const email = normalizeEmail(data.email);

    if (data.invitationToken) {
      const foundInvitation = await findTeamInvitationByToken(
        data.invitationToken,
        {
          id: true,
          email: true,
          status: true,
          expiresAt: true
        }
      );

      if (!foundInvitation) {
        return fail("Invitation not found.", 404, {
          invitationToken: "This invitation link is invalid."
        });
      }

      const invitation = await expireTeamInvitationIfNeeded(foundInvitation);

      if (invitation.status === "EXPIRED") {
        return fail("This invitation has expired.", 410, {
          invitationToken: "Ask the business owner for a new invitation."
        });
      }

      if (invitation.status !== "PENDING") {
        return fail(
          `This invitation is ${invitation.status.toLowerCase()}.`,
          409,
          {
            invitationToken: "This invitation can no longer be used."
          }
        );
      }

      if (email !== normalizeEmail(invitation.email)) {
        return fail(
          `Create the account with ${invitation.email} to continue.`,
          403,
          {
            email: `This invitation was sent to ${invitation.email}.`
          }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return fail("An account with this email already exists.", 409, {
        email: "An account with this email already exists."
      });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        platformRole: "USER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        platformRole: true
      }
    });

    return created({
      user,
      message: "Account created successfully."
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return fail("An account with this email already exists.", 409, {
        email: "An account with this email already exists."
      });
    }

    return handleApiError(error);
  }
}
