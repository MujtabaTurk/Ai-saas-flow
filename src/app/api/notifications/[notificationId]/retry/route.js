import {
  findTenantNotification,
  getRequestedBusinessId,
  requireNotificationContext,
  retryNotification
} from "@/features/notifications/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

export async function POST(request, { params }) {
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

    const updatedNotification = await retryNotification(notification);

    return ok({
      notification: updatedNotification,
      message:
        updatedNotification.deliveryStatus === "SENT"
          ? "Email notification sent."
          : "Email delivery was attempted. Check its latest status."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
