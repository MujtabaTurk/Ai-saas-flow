import {
  getRequestedBusinessId,
  requireNotificationContext
} from "@/features/notifications/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { business } = await requireNotificationContext(
      getRequestedBusinessId(request)
    );
    const result = await prisma.notification.updateMany({
      where: {
        businessId: business.id,
        audience: "BUSINESS",
        channel: "IN_APP",
        OR: [{ isRead: false }, { readAt: null }]
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return ok({
      updatedCount: result.count,
      message:
        result.count === 1
          ? "1 notification marked as read."
          : `${result.count} notifications marked as read.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
