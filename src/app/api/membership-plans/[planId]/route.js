import {
  assertMembershipWriteAccess,
  findTenantMembershipPlan,
  getRequestedBusinessId,
  mapMembershipPlan,
  membershipPlanSelect,
  normalizeMembershipPlanInput,
  requireMembershipBusiness
} from "@/features/memberships/server";
import { membershipPlanApiSchema } from "@/features/memberships/validation/membership-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { planId } = await params;
    const { user, business } = await requireMembershipBusiness(
      getRequestedBusinessId(request)
    );
    assertMembershipWriteAccess(user, business);

    const existingPlan = await findTenantMembershipPlan({
      businessId: business.id,
      planId,
      select: {
        id: true
      }
    });

    if (!existingPlan) {
      return fail("Membership plan not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      membershipPlanApiSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the membership plan form.", 422, errors);
    }

    const normalized = normalizeMembershipPlanInput(data, business);
    const conflictingSlug = await prisma.membershipPlan.findUnique({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: normalized.slug
        }
      },
      select: {
        id: true
      }
    });

    if (conflictingSlug && conflictingSlug.id !== planId) {
      return fail("A membership plan with this slug already exists.", 409, {
        slug: "A membership plan with this slug already exists."
      });
    }

    const plan = await prisma.membershipPlan.update({
      where: {
        id: planId
      },
      data: normalized,
      select: membershipPlanSelect
    });

    return ok({
      plan: mapMembershipPlan(plan),
      message: "Membership plan updated."
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return fail("A membership plan with this slug already exists.", 409, {
        slug: "A membership plan with this slug already exists."
      });
    }

    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { planId } = await params;
    const { user, business } = await requireMembershipBusiness(
      getRequestedBusinessId(request)
    );
    assertMembershipWriteAccess(user, business);

    const existingPlan = await findTenantMembershipPlan({
      businessId: business.id,
      planId,
      select: {
        id: true
      }
    });

    if (!existingPlan) {
      return fail("Membership plan not found.", 404);
    }

    const membershipCount = await prisma.customerMembership.count({
      where: {
        planId,
        businessId: business.id
      }
    });

    if (membershipCount > 0) {
      const archivedPlan = await prisma.membershipPlan.update({
        where: {
          id: planId
        },
        data: {
          isActive: false
        },
        select: membershipPlanSelect
      });

      return ok({
        plan: mapMembershipPlan(archivedPlan),
        message: "Membership plan has active history, so it was deactivated instead of deleted."
      });
    }

    await prisma.membershipPlan.delete({
      where: {
        id: planId
      }
    });

    return ok({
      message: "Membership plan deleted."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
