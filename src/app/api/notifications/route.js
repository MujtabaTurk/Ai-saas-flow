import { getEmailConfiguration } from "@/features/notifications/email-provider";
import {
  getRequestedBusinessId,
  notificationSelect,
  requireNotificationContext
} from "@/features/notifications/server";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const CHANNELS = ["ALL", "IN_APP", "EMAIL"];
const AUDIENCES = ["ALL", "BUSINESS", "CUSTOMER"];
const DELIVERY_STATUSES = ["ALL", "PENDING", "SENT", "FAILED", "SKIPPED"];

export async function GET(request) {
  try {
    const { business } = await requireNotificationContext(
      getRequestedBusinessId(request)
    );
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") || "ALL";
    const audience = searchParams.get("audience") || "ALL";
    const deliveryStatus = searchParams.get("deliveryStatus") || "ALL";
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(
      searchParams.get("pageSize") || DEFAULT_PAGE_SIZE
    );

    if (!CHANNELS.includes(channel)) {
      return fail("Choose a valid notification channel.", 422);
    }

    if (!AUDIENCES.includes(audience)) {
      return fail("Choose a valid notification audience.", 422);
    }

    if (!DELIVERY_STATUSES.includes(deliveryStatus)) {
      return fail("Choose a valid delivery status.", 422);
    }

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_PAGE_SIZE
    ) {
      return fail("Choose valid notification pagination values.", 422);
    }

    const notificationWhere = {
      businessId: business.id,
      ...(channel !== "ALL" ? { channel } : {}),
      ...(audience !== "ALL" ? { audience } : {}),
      ...(deliveryStatus !== "ALL" ? { deliveryStatus } : {}),
      ...(unreadOnly
        ? {
            audience: "BUSINESS",
            channel: "IN_APP",
            readAt: null
          }
        : {})
    };
    const [
      notifications,
      filteredTotal,
      total,
      unread,
      emailFailed,
      emailPending
    ] = await Promise.all([
      prisma.notification.findMany({
        where: notificationWhere,
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: notificationSelect
      }),
      prisma.notification.count({
        where: notificationWhere
      }),
      prisma.notification.count({
        where: {
          businessId: business.id
        }
      }),
      prisma.notification.count({
        where: {
          businessId: business.id,
          audience: "BUSINESS",
          channel: "IN_APP",
          readAt: null
        }
      }),
      prisma.notification.count({
        where: {
          businessId: business.id,
          channel: "EMAIL",
          deliveryStatus: "FAILED"
        }
      }),
      prisma.notification.count({
        where: {
          businessId: business.id,
          channel: "EMAIL",
          deliveryStatus: "PENDING"
        }
      })
    ]);
    const totalPages = Math.max(Math.ceil(filteredTotal / pageSize), 1);

    return ok({
      notifications,
      summary: {
        total,
        unread,
        emailFailed,
        emailPending
      },
      email: getEmailConfiguration(),
      pagination: {
        page,
        pageSize,
        totalItems: filteredTotal,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
