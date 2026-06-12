import {
  isAdminRecordId,
  requireSuperAdminContext
} from "@/features/admin/server";
import { businessStatusSchema } from "@/features/admin/validation/admin-schema";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireSuperAdminContext();
    const { businessId } = await params;

    if (!isAdminRecordId(businessId)) {
      return fail("Business not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      businessStatusSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the business status update.", 422, errors);
    }

    const business = await prisma.business.findUnique({
      where: {
        id: businessId
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    if (!business) {
      return fail("Business not found.", 404);
    }

    if (business.status === data.status) {
      return ok({
        business,
        message: `${business.name} is already ${data.status.toLowerCase()}.`
      });
    }

    const updatedBusiness = await prisma.$transaction(async (transaction) => {
      const result = await transaction.business.updateMany({
        where: {
          id: business.id,
          status: business.status
        },
        data: {
          status: data.status
        }
      });

      if (result.count === 0) {
        throw new AppError(
          "This business changed while you were updating it. Refresh and try again.",
          409
        );
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          businessId: business.id,
          action: "BUSINESS_STATUS_CHANGED",
          targetType: "BUSINESS",
          targetId: business.id,
          reason: data.reason || null,
          metadata: {
            businessName: business.name,
            previousStatus: business.status,
            nextStatus: data.status
          }
        }
      });

      return transaction.business.findUnique({
        where: {
          id: business.id
        },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true
        }
      });
    });

    return ok({
      business: updatedBusiness,
      message: `${business.name} marked ${data.status.toLowerCase()}.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
