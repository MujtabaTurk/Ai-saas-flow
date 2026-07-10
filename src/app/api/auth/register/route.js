import { created, fail } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateJsonRequest } from "@/lib/api/request";
import { prisma } from "@/lib/prisma";
import {
  buildEmailVerificationUrl,
  createStoredEmailVerificationToken
} from "@/features/auth/email-verification";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { hashPassword } from "@/features/auth/password";
import { registerSchema } from "@/features/auth/validation/register-schema";
import {
  expireTeamInvitationIfNeeded,
  findTeamInvitationByToken
} from "@/features/team/invitation-access";
import {
  notifyWelcomeUser,
  sendEmailVerificationEmail
} from "@/features/notifications/events";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { data, errors } = await validateJsonRequest(request, registerSchema);

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
        platformRole: "USER",
        customerPortalEnabled: data.accountType === "CUSTOMER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        platformRole: true
      }
    });
    let devVerificationUrl = null;

    try {
      const { token, tokenHash } = await createStoredEmailVerificationToken(
        email
      );
      const verificationUrl = buildEmailVerificationUrl(token, {
        callbackUrl:
          data.accountType === "CUSTOMER" ? "/customer" : "/onboarding"
      });

      if (verificationUrl) {
        devVerificationUrl =
          process.env.NODE_ENV !== "production" ? verificationUrl : null;
        await sendEmailVerificationEmail({
          email,
          verificationUrl,
          tokenHash
        });
      }
    } catch (verificationError) {
      console.error(
        "Could not send verification email.",
        verificationError
      );
    }

    if (data.accountType !== "CUSTOMER") {
      try {
        await notifyWelcomeUser({ user });
      } catch (notificationError) {
        console.error("Could not send welcome email.", notificationError);
      }
    }

    return created({
      user,
      message: "Account created successfully.",
      ...(devVerificationUrl ? { devVerificationUrl } : {})
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
