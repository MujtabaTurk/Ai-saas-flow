import { assertBusinessManagement } from "@/features/auth/permissions";
import { sendTransactionalEmail } from "@/features/notifications/email/service";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const notificationSelect = {
  id: true,
  businessId: true,
  bookingId: true,
  subscriptionId: true,
  type: true,
  audience: true,
  channel: true,
  deliveryStatus: true,
  recipientEmail: true,
  title: true,
  message: true,
  actionUrl: true,
  metadata: true,
  readAt: true,
  sentAt: true,
  lastAttemptAt: true,
  attempts: true,
  lastError: true,
  createdAt: true,
  updatedAt: true
};

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function requireNotificationContext(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before viewing notifications.",
      409
    );
  }

  if (!isValidMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBusinessManagement(user, businessId);

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
    throw new NotFoundError("Business not found.");
  }

  return {
    user,
    business
  };
}

export async function findTenantNotification({
  businessId,
  notificationId,
  select = notificationSelect
}) {
  if (!isValidMongoObjectId(notificationId)) {
    return null;
  }

  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      businessId
    },
    select
  });
}

async function deliverEmailNotification(notification) {
  const attemptTime = new Date();

  try {
    const result = await sendTransactionalEmail({
      to: notification.recipientEmail,
      subject: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      actionLabel: notification.metadata?.emailActionLabel || "Open ServiceFlow",
      idempotencyKey: `notification:${notification.id}`,
      template: notification.metadata?.emailTemplate || "generic-notification",
      templateData: {
        ...(notification.metadata?.emailData || {}),
        actionUrl: notification.actionUrl,
        actionLabel: notification.metadata?.emailActionLabel
      }
    });

    return prisma.notification.update({
      where: {
        id: notification.id
      },
      data: {
        deliveryStatus: result.skipped ? "SKIPPED" : "SENT",
        sentAt: result.skipped ? null : attemptTime,
        lastAttemptAt: attemptTime,
        attempts: {
          increment: 1
        },
        lastError: result.skipped ? result.reason : null,
        metadata: {
          ...(notification.metadata || {}),
          ...(result.providerMessageId
            ? {
                providerMessageId: result.providerMessageId
              }
            : {})
        }
      },
      select: notificationSelect
    });
  } catch (error) {
    await prisma.notification.update({
      where: {
        id: notification.id
      },
      data: {
        deliveryStatus: "FAILED",
        lastAttemptAt: attemptTime,
        attempts: {
          increment: 1
        },
        lastError: error?.message || "Email delivery failed."
      }
    });

    return findTenantNotification({
      businessId: notification.businessId,
      notificationId: notification.id
    });
  }
}

export async function queueNotification(input) {
  let notification = await prisma.notification.findUnique({
    where: {
      dedupeKey: input.dedupeKey
    },
    select: notificationSelect
  });

  if (!notification) {
    try {
      notification = await prisma.notification.create({
        data: {
          businessId: input.businessId,
          bookingId: input.bookingId || null,
          subscriptionId: input.subscriptionId || null,
          dedupeKey: input.dedupeKey,
          type: input.type,
          audience: input.audience,
          channel: input.channel,
          deliveryStatus: input.channel === "IN_APP" ? "SENT" : "PENDING",
          recipientEmail: input.recipientEmail || null,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl || null,
          metadata: input.metadata || null,
          sentAt: input.channel === "IN_APP" ? new Date() : null
        },
        select: notificationSelect
      });
    } catch (error) {
      if (error?.code !== "P2002") {
        throw error;
      }

      notification = await prisma.notification.findUnique({
        where: {
          dedupeKey: input.dedupeKey
        },
        select: notificationSelect
      });
    }
  }

  if (
    notification?.channel === "EMAIL" &&
    notification.deliveryStatus === "PENDING"
  ) {
    return deliverEmailNotification(notification);
  }

  return notification;
}

export async function retryNotification(notification) {
  if (notification.channel !== "EMAIL") {
    throw new AppError("Only email notifications can be retried.", 409);
  }

  if (!["FAILED", "SKIPPED"].includes(notification.deliveryStatus)) {
    throw new AppError(
      "Only failed or skipped email notifications can be retried.",
      409
    );
  }

  return deliverEmailNotification(notification);
}
