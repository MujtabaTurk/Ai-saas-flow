import {
  assertServiceAssignmentsBelongToBusiness,
  assertTeamWriteAccess,
  findTenantMember,
  getRequestedBusinessId,
  getTeamSnapshot,
  requireTeamContext
} from "@/features/team/server";
import { teamServiceAssignmentSchema } from "@/features/team/validation/team-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PUT(request, { params }) {
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
      teamServiceAssignmentSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the service assignments.", 422, errors);
    }

    const serviceIds = await assertServiceAssignmentsBelongToBusiness(
      data.serviceIds,
      business.id
    );
    const previousServiceIds = member.serviceAssignments.map(
      (assignment) => assignment.serviceId
    );
    const removedServiceIds = previousServiceIds.filter(
      (serviceId) => !serviceIds.includes(serviceId)
    );

    await prisma.$transaction(async (transaction) => {
      await transaction.staffServiceAssignment.deleteMany({
        where: {
          businessId: business.id,
          membershipId: member.id
        }
      });

      if (serviceIds.length > 0) {
        await transaction.staffServiceAssignment.createMany({
          data: serviceIds.map((serviceId) => ({
            businessId: business.id,
            membershipId: member.id,
            serviceId
          }))
        });
      }

      if (removedServiceIds.length > 0) {
        await transaction.booking.updateMany({
          where: {
            businessId: business.id,
            assignedMemberId: member.id,
            serviceId: {
              in: removedServiceIds
            },
            status: {
              in: ["PENDING", "CONFIRMED"]
            }
          },
          data: {
            assignedMemberId: null
          }
        });
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: "TEAM_MEMBER_SERVICES_CHANGED",
          targetType: "TEAM_MEMBER",
          targetId: member.id,
          metadata: {
            previousServiceIds,
            serviceIds
          }
        }
      });
    });

    return ok({
      team: await getTeamSnapshot({ user, business }),
      message: "Service assignments updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
