import { buildBookingSummary } from "@/features/bookings/booking-summary";
import { assertBusinessWriteAccess } from "@/features/auth/permissions";
import { BOOKING_STATUSES } from "@/features/bookings/constants";
import { bookingRequestSchema } from "@/features/bookings/validation/booking-schema";
import {
  bookingListSelect,
  createBooking,
  getRequestedBusinessId,
  requireBookingContext
} from "@/features/bookings/server";
import { notifyBookingCreated } from "@/features/notifications/events";
import { created, fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateJsonRequest } from "@/lib/api/request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const STATUS_VALUES = Object.values(BOOKING_STATUSES);

function parseBookingListQuery(searchParams) {
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(
    searchParams.get("pageSize") || DEFAULT_PAGE_SIZE
  );

  if (status && status !== "ALL" && !STATUS_VALUES.includes(status)) {
    return {
      error: fail("Choose a valid booking status.", 422, {
        status: "Choose a valid booking status."
      })
    };
  }

  if (search && search.length > 100) {
    return {
      error: fail("Search must be 100 characters or fewer.", 422, {
        search: "Search must be 100 characters or fewer."
      })
    };
  }

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE
  ) {
    return {
      error: fail("Choose valid booking pagination values.", 422, {
        page: "Page must be a positive whole number.",
        pageSize: `Page size must be between 1 and ${MAX_PAGE_SIZE}.`
      })
    };
  }

  return {
    page,
    pageSize,
    search,
    status
  };
}

function getStaffBookingScope(user) {
  return user.businessRole === "STAFF"
    ? {
        assignedMemberId: user.activeBusinessMembershipId
      }
    : {};
}

function buildBookingSearchFilter(search) {
  if (!search) {
    return {};
  }

  return {
    OR: [
      { bookingNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { serviceNameSnapshot: { contains: search, mode: "insensitive" } }
    ]
  };
}

function buildBookingListWhere({ business, query, scopeWhere }) {
  return {
    businessId: business.id,
    ...scopeWhere,
    ...(query.status && query.status !== "ALL"
      ? { status: query.status }
      : {}),
    ...buildBookingSearchFilter(query.search)
  };
}

function buildPagination({ page, pageSize, totalItems }) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

export async function GET(request) {
  try {
    const { business, user } = await requireBookingContext(
      getRequestedBusinessId(request)
    );
    const { searchParams } = new URL(request.url);
    const query = parseBookingListQuery(searchParams);

    if (query.error) {
      return query.error;
    }

    const scopeWhere = getStaffBookingScope(user);
    const bookingWhere = buildBookingListWhere({
      business,
      query,
      scopeWhere
    });

    const [bookings, summary] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        orderBy: {
          startsAt: "desc"
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: bookingListSelect
      }),
      buildBookingSummary({
        business,
        filteredWhere: bookingWhere,
        scopeWhere,
        user
      })
    ]);

    return ok({
      bookings,
      summary,
      pagination: buildPagination({
        page: query.page,
        pageSize: query.pageSize,
        totalItems: summary.filteredTotal
      })
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const { business, user } = await requireBookingContext(
      getRequestedBusinessId(request)
    );
    assertBusinessWriteAccess(user, business);
    const { data, errors } = await validateJsonRequest(
      request,
      bookingRequestSchema
    );

    if (errors) {
      return fail("Please check the booking form.", 422, errors);
    }

    const result = await createBooking({
      business,
      input: data,
      source: "DASHBOARD",
      createdByUserId: user.id
    });

    try {
      await notifyBookingCreated({
        booking: result.booking,
        customerAccessToken: result.customerAccessToken
      });
    } catch (notificationError) {
      console.error(
        "Could not queue booking-created notifications.",
        notificationError
      );
    }

    return created({
      booking: result.booking,
      message: "Booking created."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
