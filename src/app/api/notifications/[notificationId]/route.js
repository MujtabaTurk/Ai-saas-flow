import {
  findTenantNotification,
  getRequestedBusinessId,
  notificationSelect,
  requireNotificationContext
} from "@/features/notifications/server";
import { notificationReadSchema } from "@/features/notifications/validation/notification-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { business } = await requireNotificationContext(
      getRequestedBusinessId(request)
    );
    const { notificationId } = await params;
    const notification = await findTenantNotification({
      businessId: business.id,
      notificationId
    });

    if (!notification) {
      return fail("Notification not found.", 404);
    }

    if (
      notification.channel !== "IN_APP" ||
      notification.audience !== "BUSINESS"
    ) {
      return fail("Only business in-app notifications have a read state.", 409);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      notificationReadSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the notification update.", 422, errors);
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: notification.id,
        businessId: business.id,
        channel: "IN_APP",
        audience: "BUSINESS"
      },
      data: {
        readAt: data.isRead ? new Date() : null
      }
    });

    if (result.count === 0) {
      return fail("Notification not found.", 404);
    }

    return ok({
      notification: await prisma.notification.findUnique({
        where: {
          id: notification.id
        },
        select: notificationSelect
      }),
      message: data.isRead
        ? "Notification marked as read."
        : "Notification marked as unread."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
