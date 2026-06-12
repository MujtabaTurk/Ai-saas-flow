import {
  assertTeamWriteAccess,
  findTenantMember,
  getRequestedBusinessId,
  getTeamSnapshot,
  requireTeamContext
} from "@/features/team/server";
import { teamMemberRoleSchema } from "@/features/team/validation/team-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { user, business } = await requireTeamContext(
      getRequestedBusinessId(request)
    );
    assertTeamWriteAccess(user, business);
    const { membershipId } = await params;
    const member = await findTenantMember({
      businessId: business.id,
      membershipId
    });

    if (!member || !member.isActive) {
      return fail("Active team member not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      teamMemberRoleSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the team member role.", 422, errors);
    }

    if (member.role !== data.role) {
      await prisma.$transaction([
        prisma.businessMembership.update({
          where: {
            id: member.id
          },
          data: {
            role: data.role
          }
        }),
        prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            businessId: business.id,
            action: "TEAM_MEMBER_ROLE_CHANGED",
            targetType: "TEAM_MEMBER",
            targetId: member.id,
            metadata: {
              previousRole: member.role,
              role: data.role,
              userId: member.userId
            }
          }
        })
      ]);
    }

    return ok({
      team: await getTeamSnapshot({ user, business }),
      message: "Team member role updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, business } = await requireTeamContext(
      getRequestedBusinessId(request)
    );
    assertTeamWriteAccess(user, business);
    const { membershipId } = await params;
    const member = await findTenantMember({
      businessId: business.id,
      membershipId
    });

    if (!member || !member.isActive) {
      return fail("Active team member not found.", 404);
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.booking.updateMany({
        where: {
          businessId: business.id,
          assignedMemberId: member.id,
          status: {
            in: ["PENDING", "CONFIRMED"]
          }
        },
        data: {
          assignedMemberId: null
        }
      });
      await transaction.staffServiceAssignment.deleteMany({
        where: {
          businessId: business.id,
          membershipId: member.id
        }
      });
      await transaction.staffAvailability.deleteMany({
        where: {
          businessId: business.id,
          membershipId: member.id
        }
      });
      await transaction.businessMembership.update({
        where: {
          id: member.id
        },
        data: {
          isActive: false
        }
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: "TEAM_MEMBER_REMOVED",
          targetType: "TEAM_MEMBER",
          targetId: member.id,
          metadata: {
            userId: member.userId,
            email: member.user.email,
            role: member.role
          }
        }
      });
    });

    return ok({
      team: await getTeamSnapshot({ user, business }),
      message: "Team member removed. Active bookings were returned to the unassigned queue."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
