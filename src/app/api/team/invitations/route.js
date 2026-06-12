import { normalizeEmail } from "@/features/auth/normalize-email";
import { notifyTeamInvitation } from "@/features/notifications/events";
import {
  getTeamMemberLimit,
  getTeamSeatUsage
} from "@/features/team/policy";
import { createTeamInvitationToken } from "@/features/team/token";
import {
  TEAM_INVITATION_DAYS,
  assertTeamWriteAccess,
  getRequestedBusinessId,
  getTeamSnapshot,
  requireTeamContext,
  teamInvitationSelect
} from "@/features/team/server";
import { teamInvitationSchema } from "@/features/team/validation/team-schema";
import { created, fail } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request) {
  try {
    const { user, business } = await requireTeamContext(
      getRequestedBusinessId(request)
    );
    assertTeamWriteAccess(user, business);
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      teamInvitationSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the invitation.", 422, errors);
    }

    const email = normalizeEmail(data.email);

    if (email === normalizeEmail(business.owner.email)) {
      return fail("The business owner already belongs to this team.", 409, {
        email: "This email belongs to the business owner."
      });
    }

    const [activeMember, existingInvitation] = await Promise.all([
      prisma.businessMembership.findFirst({
        where: {
          businessId: business.id,
          isActive: true,
          user: {
            email
          }
        },
        select: {
          id: true
        }
      }),
      prisma.teamInvitation.findUnique({
        where: {
          businessId_email: {
            businessId: business.id,
            email
          }
        },
        select: {
          id: true,
          status: true,
          expiresAt: true
        }
      })
    ]);

    if (activeMember) {
      return fail("This user is already an active team member.", 409, {
        email: "This user is already on the team."
      });
    }

    const { token, tokenHash } = createTeamInvitationToken();
    const expiresAt = new Date(
      Date.now() + TEAM_INVITATION_DAYS * DAY_MS
    );
    const invitation = await prisma.$transaction(async (transaction) => {
      const now = new Date();
      await transaction.business.update({
        where: {
          id: business.id
        },
        data: {
          updatedAt: now
        }
      });
      await transaction.teamInvitation.updateMany({
        where: {
          businessId: business.id,
          status: "PENDING",
          expiresAt: {
            lte: now
          }
        },
        data: {
          status: "EXPIRED"
        }
      });
      const [activeMemberships, pendingInvitations, currentInvitation] =
        await Promise.all([
          transaction.businessMembership.count({
            where: {
              businessId: business.id,
              isActive: true
            }
          }),
          transaction.teamInvitation.count({
            where: {
              businessId: business.id,
              status: "PENDING",
              expiresAt: {
                gt: now
              }
            }
          }),
          transaction.teamInvitation.findUnique({
            where: {
              businessId_email: {
                businessId: business.id,
                email
              }
            },
            select: {
              id: true,
              status: true,
              expiresAt: true
            }
          })
        ]);
      const planCode = business.subscriptions?.[0]?.planCode || "TRIAL";
      const limit = getTeamMemberLimit(planCode);
      const used = getTeamSeatUsage({
        activeMemberships,
        pendingInvitations
      });
      const hasReservedSeat =
        currentInvitation?.status === "PENDING" &&
        currentInvitation.expiresAt > now;

      if (!hasReservedSeat && limit !== null && used >= limit) {
        throw new AppError(
          `The ${planCode} plan has reached its ${limit}-seat team limit.`,
          403,
          {
            teamMembers: "Upgrade the subscription or remove a team member."
          }
        );
      }

      const savedInvitation = existingInvitation
        ? await transaction.teamInvitation.update({
            where: {
              id: existingInvitation.id
            },
            data: {
              role: data.role,
              tokenHash,
              status: "PENDING",
              expiresAt,
              invitedByUserId: user.id,
              acceptedByUserId: null,
              acceptedAt: null
            },
            select: teamInvitationSelect
          })
        : await transaction.teamInvitation.create({
            data: {
              businessId: business.id,
              email,
              role: data.role,
              tokenHash,
              expiresAt,
              invitedByUserId: user.id
            },
            select: teamInvitationSelect
          });

      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: "TEAM_INVITATION_SENT",
          targetType: "TEAM_INVITATION",
          targetId: savedInvitation.id,
          metadata: {
            email,
            role: data.role,
            expiresAt
          }
        }
      });

      return savedInvitation;
    });

    try {
      await notifyTeamInvitation({
        invitation,
        business,
        token
      });
    } catch (notificationError) {
      console.error("Could not send team invitation notification.", notificationError);
    }

    return created({
      invitation,
      team: await getTeamSnapshot({ user, business }),
      message: `Invitation sent to ${email}.`
    });
  } catch (error) {
    if (error?.code === "P2034") {
      return fail(
        "The team changed while reserving this seat. Please try again.",
        409
      );
    }

    return handleApiError(error);
  }
}
