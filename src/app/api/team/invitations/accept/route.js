import { normalizeEmail } from "@/features/auth/normalize-email";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import { notifyTeamMemberJoined } from "@/features/notifications/events";
import {
  expireTeamInvitationIfNeeded,
  findTeamInvitationByToken,
  getPublicTeamInvitation
} from "@/features/team/invitation-access";
import { getTeamUsage, teamMemberSelect } from "@/features/team/server";
import { invitationAcceptanceSchema } from "@/features/team/validation/team-schema";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const acceptanceInvitationSelect = {
  id: true,
  businessId: true,
  email: true,
  role: true,
  invitedByUserId: true,
  status: true,
  expiresAt: true,
  business: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      subscriptions: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        select: {
          planCode: true,
          status: true,
          currentPeriodEnd: true,
          trialEndsAt: true
        }
      }
    }
  }
};

export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    const invitation = await getPublicTeamInvitation(token);

    if (!invitation) {
      return fail("Invitation not found.", 404);
    }

    return ok({
      invitation
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      invitationAcceptanceSchema,
      payload || {}
    );

    if (errors) {
      return fail("Invitation token is invalid.", 422, errors);
    }

    const foundInvitation = await findTeamInvitationByToken(
      data.token,
      acceptanceInvitationSelect
    );

    if (!foundInvitation) {
      return fail("Invitation not found.", 404);
    }

    const invitation = await expireTeamInvitationIfNeeded(foundInvitation);

    if (invitation.status === "EXPIRED") {
      return fail("This invitation has expired.", 410);
    }

    if (invitation.status !== "PENDING") {
      return fail(`This invitation is ${invitation.status.toLowerCase()}.`, 409);
    }

    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return fail("Sign in to accept this invitation.", 401, {
        code: "AUTHENTICATION_REQUIRED",
        invitedEmail: invitation.email
      });
    }

    const databaseUser = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!databaseUser) {
      return fail("Sign in to accept this invitation.", 401, {
        code: "AUTHENTICATION_REQUIRED",
        invitedEmail: invitation.email
      });
    }

    if (
      !databaseUser.email ||
      normalizeEmail(databaseUser.email) !== normalizeEmail(invitation.email)
    ) {
      return fail(
        databaseUser.email
          ? `This invitation was sent to ${invitation.email}, but you are signed in as ${databaseUser.email}.`
          : `This invitation was sent to ${invitation.email}, but your current account has no email address.`,
        403,
        {
          code: "INVITATION_EMAIL_MISMATCH",
          invitedEmail: invitation.email,
          authenticatedEmail: databaseUser.email
        }
      );
    }

    if (invitation.business.status !== "ACTIVE") {
      return fail("This business is not currently accepting team members.", 403);
    }

    const entitlement = getSubscriptionEntitlement(
      invitation.business.subscriptions[0]
    );

    if (!entitlement.isEntitled) {
      throw new AppError(
        "The business needs an active subscription before this invitation can be accepted.",
        402
      );
    }

    const usage = await getTeamUsage(invitation.business);

    if (usage.limit !== null && usage.used > usage.limit) {
      return fail(
        "The business is above its current team limit. Ask the owner to upgrade or free a seat.",
        403
      );
    }

    const now = new Date();
    const membership = await prisma.$transaction(async (transaction) => {
      const accepted = await transaction.teamInvitation.updateMany({
        where: {
          id: invitation.id,
          status: "PENDING",
          expiresAt: {
            gt: now
          }
        },
        data: {
          status: "ACCEPTED",
          acceptedByUserId: databaseUser.id,
          acceptedAt: now
        }
      });

      if (accepted.count === 0) {
        throw new AppError(
          "This invitation changed while it was being accepted. Refresh and try again.",
          409
        );
      }

      const savedMembership = await transaction.businessMembership.upsert({
        where: {
          businessId_userId: {
            businessId: invitation.businessId,
            userId: databaseUser.id
          }
        },
        create: {
          businessId: invitation.businessId,
          userId: databaseUser.id,
          invitedByUserId: invitation.invitedByUserId,
          role: invitation.role,
          isActive: true,
          joinedAt: now
        },
        update: {
          role: invitation.role,
          isActive: true,
          invitedByUserId: invitation.invitedByUserId,
          joinedAt: now
        },
        select: teamMemberSelect
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: databaseUser.id,
          businessId: invitation.businessId,
          action: "TEAM_MEMBER_JOINED",
          targetType: "TEAM_MEMBER",
          targetId: savedMembership.id,
          metadata: {
            invitationId: invitation.id,
            role: invitation.role,
            email: invitation.email
          }
        }
      });

      return savedMembership;
    });

    try {
      await notifyTeamMemberJoined({
        business: invitation.business,
        membership
      });
    } catch (notificationError) {
      console.error("Could not queue team-member notification.", notificationError);
    }

    return ok({
      membership,
      business: {
        id: invitation.business.id,
        name: invitation.business.name,
        slug: invitation.business.slug
      },
      message: `You joined ${invitation.business.name}.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
