import {
  assertMembershipWriteAccess,
  getBusinessMembershipPlans,
  getRequestedBusinessId,
  mapMembershipPlan,
  membershipPlanSelect,
  normalizeMembershipPlanInput,
  requireMembershipBusiness
} from "@/features/memberships/server";
import { membershipPlanApiSchema } from "@/features/memberships/validation/membership-schema";
import { created, fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateJsonRequest } from "@/lib/api/request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { business } = await requireMembershipBusiness(
      getRequestedBusinessId(request)
    );
    const plans = await getBusinessMembershipPlans({ businessId: business.id });

    return ok({ plans });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const { user, business } = await requireMembershipBusiness(
      getRequestedBusinessId(request)
    );
    assertMembershipWriteAccess(user, business);

    const { data, errors } = await validateJsonRequest(
      request,
      membershipPlanApiSchema
    );

    if (errors) {
      return fail("Please check the membership plan form.", 422, errors);
    }

    const normalized = normalizeMembershipPlanInput(data, business);
    const existingSlug = await prisma.membershipPlan.findUnique({
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

    if (existingSlug) {
      return fail("A membership plan with this slug already exists.", 409, {
        slug: "A membership plan with this slug already exists."
      });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        ...normalized,
        businessId: business.id
      },
      select: membershipPlanSelect
    });

    return created({
      plan: mapMembershipPlan(plan),
      message: "Membership plan created."
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
