import {
  assertTeamWriteAccess,
  findTenantInvitation,
  getRequestedBusinessId,
  getTeamSnapshot,
  requireTeamContext
} from "@/features/team/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(request, { params }) {
  try {
    const { user, business } = await requireTeamContext(
      getRequestedBusinessId(request)
    );
    assertTeamWriteAccess(user, business);
    const { invitationId } = await params;
    const invitation = await findTenantInvitation({
      businessId: business.id,
      invitationId
    });

    if (!invitation) {
      return fail("Invitation not found.", 404);
    }

    if (invitation.status !== "PENDING") {
      return fail("Only pending invitations can be revoked.", 409);
    }

    await prisma.$transaction([
      prisma.teamInvitation.update({
        where: {
          id: invitation.id
        },
        data: {
          status: "REVOKED"
        }
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: "TEAM_INVITATION_REVOKED",
          targetType: "TEAM_INVITATION",
          targetId: invitation.id,
          metadata: {
            email: invitation.email,
            role: invitation.role
          }
        }
      })
    ]);

    return ok({
      team: await getTeamSnapshot({ user, business }),
      message: "Invitation revoked."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
