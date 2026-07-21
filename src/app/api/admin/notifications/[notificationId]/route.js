import { requireSuperAdminContext } from "@/features/admin/server";
import { notificationSelect } from "@/features/notifications/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireSuperAdminContext();
    const { notificationId } = await params;
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, audience: "ADMIN", OR: [{ userId: user.id }, { userId: null }] },
      data: { isRead: true, readAt: new Date() }
    });
    if (result.count !== 1) return fail("Notification not found.", 404);
    return ok({ notification: await prisma.notification.findUnique({ where: { id: notificationId }, select: notificationSelect }) });
  } catch (error) {
    return handleApiError(error);
  }
}
