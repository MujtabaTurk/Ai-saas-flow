import { normalizeEmail } from "@/features/auth/normalize-email";
import { hashToken } from "@/features/auth/password";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import { notifyTeamMemberJoined } from "@/features/notifications/events";
import { getTeamUsage, teamMemberSelect } from "@/features/team/server";
import { invitationAcceptanceSchema } from "@/features/team/validation/team-schema";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { requireCurrentUser } from "@/lib/auth/session";
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

async function findInvitation(token) {
  if (!token) {
    return null;
  }

  return prisma.teamInvitation.findUnique({
    where: {
      tokenHash: hashToken(token)
    },
    select: acceptanceInvitationSelect
  });
}

function publicInvitation(invitation) {
  return {
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    business: {
      name: invitation.business.name,
      slug: invitation.business.slug
    }
  };
}

export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    const invitation = await findInvitation(token);

    if (!invitation) {
      return fail("Invitation not found.", 404);
    }

    if (invitation.status === "PENDING" && invitation.expiresAt <= new Date()) {
      await prisma.teamInvitation.update({
        where: {
          id: invitation.id
        },
        data: {
          status: "EXPIRED"
        }
      });
      invitation.status = "EXPIRED";
    }

    return ok({
      invitation: publicInvitation(invitation)
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireCurrentUser();
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      invitationAcceptanceSchema,
      payload || {}
    );

    if (errors) {
      return fail("Invitation token is invalid.", 422, errors);
    }

    const [invitation, databaseUser] = await Promise.all([
      findInvitation(data.token),
      prisma.user.findUnique({
        where: {
          id: user.id
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      })
    ]);

    if (!invitation) {
      return fail("Invitation not found.", 404);
    }

    if (invitation.status !== "PENDING") {
      return fail(`This invitation is ${invitation.status.toLowerCase()}.`, 409);
    }

    if (invitation.expiresAt <= new Date()) {
      await prisma.teamInvitation.update({
        where: {
          id: invitation.id
        },
        data: {
          status: "EXPIRED"
        }
      });
      return fail("This invitation has expired.", 410);
    }

    if (
      !databaseUser?.email ||
      normalizeEmail(databaseUser.email) !== normalizeEmail(invitation.email)
    ) {
      return fail(
        `Sign in with ${invitation.email} to accept this invitation.`,
        403
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
