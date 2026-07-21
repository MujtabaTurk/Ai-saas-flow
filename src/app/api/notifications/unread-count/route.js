import { getRequestedBusinessId, requireNotificationContext } from "@/features/notifications/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { business, user } = await requireNotificationContext(getRequestedBusinessId(request));
    const unread = await prisma.notification.count({
      where: {
        businessId: business.id,
        channel: "IN_APP",
        audience: "BUSINESS",
        OR: [{ userId: user.id, isRead: false }, { userId: user.id, readAt: null }, { userId: null, isRead: false }, { userId: null, readAt: null }]
      }
    });
    return ok({ unread });
  } catch (error) {
    return handleApiError(error);
  }
}
