import { requireSuperAdminContext } from "@/features/admin/server";
import { notificationSelect } from "@/features/notifications/server";
import { ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { user } = await requireSuperAdminContext();
    const unreadOnly = new URL(request.url).searchParams.get("unreadOnly") === "true";
    const where = {
      audience: "ADMIN",
      OR: [{ userId: user.id }, { userId: null }],
      ...(unreadOnly ? { OR: [{ userId: user.id, isRead: false }, { userId: user.id, readAt: null }, { userId: null, isRead: false }, { userId: null, readAt: null }] } : {})
    };
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, select: notificationSelect }),
      prisma.notification.count({ where: { ...where, OR: [{ userId: user.id, isRead: false }, { userId: user.id, readAt: null }, { userId: null, isRead: false }, { userId: null, readAt: null }] } })
    ]);
    return ok({ notifications, summary: { total: notifications.length, unread } });
  } catch (error) {
    return handleApiError(error);
  }
}
