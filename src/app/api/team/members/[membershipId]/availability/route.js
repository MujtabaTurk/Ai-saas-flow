import {
  assertNoStaffAvailabilityOverlap,
  assertTeamWriteAccess,
  findTenantMember,
  getRequestedBusinessId,
  getTeamSnapshot,
  requireTeamContext
} from "@/features/team/server";
import { staffAvailabilitySchema } from "@/features/team/validation/team-schema";
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
      staffAvailabilitySchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the working hours.", 422, errors);
    }

    assertNoStaffAvailabilityOverlap(data.availability);
    const previousAvailability = member.availability;

    await prisma.$transaction(async (transaction) => {
      await transaction.staffAvailability.deleteMany({
        where: {
          businessId: business.id,
          membershipId: member.id
        }
      });

      if (data.availability.length > 0) {
        await transaction.staffAvailability.createMany({
          data: data.availability.map((window) => ({
            businessId: business.id,
            membershipId: member.id,
            dayOfWeek: window.dayOfWeek,
            startTime: window.startTime,
            endTime: window.endTime,
            isActive: window.isActive !== false
          }))
        });
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: "TEAM_MEMBER_AVAILABILITY_CHANGED",
          targetType: "TEAM_MEMBER",
          targetId: member.id,
          metadata: {
            previousAvailability,
            availability: data.availability
          }
        }
      });
    });

    return ok({
      team: await getTeamSnapshot({ user, business }),
      message: "Team working hours updated."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
