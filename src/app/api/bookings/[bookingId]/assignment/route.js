import {
  bookingSelect,
  findTenantBooking,
  getRequestedBusinessId,
  requireBookingContext
} from "@/features/bookings/server";
import {
  assertTeamManagement,
  assertTeamWriteAccess,
  canMemberDeliverService,
  findTenantMember
} from "@/features/team/server";
import { bookingAssignmentSchema } from "@/features/team/validation/team-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { user, business } = await requireBookingContext(
      getRequestedBusinessId(request)
    );
    assertTeamManagement(user, business);
    assertTeamWriteAccess(user, business);
    const { bookingId } = await params;
    const booking = await findTenantBooking({
      businessId: business.id,
      bookingId
    });

    if (!booking) {
      return fail("Booking not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      bookingAssignmentSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the booking assignment.", 422, errors);
    }

    let member = null;

    if (data.membershipId) {
      member = await findTenantMember({
        businessId: business.id,
        membershipId: data.membershipId
      });

      if (!member || !member.isActive) {
        return fail("Active team member not found.", 404);
      }

      if (!canMemberDeliverService(member, booking.serviceId)) {
        return fail(
          "Assign this service to the team member before assigning the booking.",
          409
        );
      }
    }

    const updatedBooking = await prisma.$transaction(async (transaction) => {
      const savedBooking = await transaction.booking.update({
        where: {
          id: booking.id
        },
        data: {
          assignedMemberId: member?.id || null
        },
        select: bookingSelect
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: "BOOKING_ASSIGNED",
          targetType: "BOOKING",
          targetId: booking.id,
          metadata: {
            previousMembershipId: booking.assignedMemberId,
            membershipId: member?.id || null,
            serviceId: booking.serviceId
          }
        }
      });

      return savedBooking;
    });

    return ok({
      booking: updatedBooking,
      message: member
        ? `Booking assigned to ${member.user.name || member.user.email}.`
        : "Booking returned to the unassigned queue."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
