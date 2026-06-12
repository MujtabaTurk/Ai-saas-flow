import {
  assertCustomerWriteAccess,
  buildCustomerAccess,
  customerBookingSelect,
  customerSelect,
  findTenantCustomer,
  getRequestedBusinessId,
  normalizeCustomerInput,
  requireCustomerContext,
} from "@/features/customers/server";
import { customerSchema } from "@/features/customers/validation/customer-schema";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_BOOKING_PAGE_SIZE = 10;
const MAX_BOOKING_PAGE_SIZE = 50;

export async function GET(request, { params }) {
  try {
    const { business, user } = await requireCustomerContext(
      getRequestedBusinessId(request),
    );
    const { customerId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(
      searchParams.get("pageSize") || DEFAULT_BOOKING_PAGE_SIZE,
    );

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_BOOKING_PAGE_SIZE
    ) {
      return fail("Choose valid booking-history pagination values.", 422, {
        page: "Page must be a positive whole number.",
        pageSize: `Page size must be between 1 and ${MAX_BOOKING_PAGE_SIZE}.`,
      });
    }

    const customer = await findTenantCustomer({
      businessId: business.id,
      customerId,
    });

    if (!customer) {
      return fail("Customer not found.", 404);
    }

    const now = new Date();
    const [bookingTotal, upcoming, completed, canceled, bookings] =
      await Promise.all([
        prisma.booking.count({
          where: {
            businessId: business.id,
            customerId,
          },
        }),
        prisma.booking.count({
          where: {
            businessId: business.id,
            customerId,
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
            startsAt: {
              gte: now,
            },
          },
        }),
        prisma.booking.count({
          where: {
            businessId: business.id,
            customerId,
            status: "COMPLETED",
          },
        }),
        prisma.booking.count({
          where: {
            businessId: business.id,
            customerId,
            status: "CANCELED",
          },
        }),
        prisma.booking.findMany({
          where: {
            businessId: business.id,
            customerId,
          },
          orderBy: {
            startsAt: "desc",
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: customerBookingSelect,
        }),
      ]);
    const totalPages = Math.max(Math.ceil(bookingTotal / pageSize), 1);

    return ok({
      customer,
      bookings,
      summary: {
        bookingTotal,
        upcoming,
        completed,
        canceled,
      },
      access: buildCustomerAccess(user, business),
      pagination: {
        page,
        pageSize,
        totalItems: bookingTotal,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { business, user } = await requireCustomerContext(
      getRequestedBusinessId(request),
    );
    assertCustomerWriteAccess(user, business);
    const { customerId } = await params;
    const currentCustomer = await findTenantCustomer({
      businessId: business.id,
      customerId,
      select: {
        id: true,
      },
    });

    if (!currentCustomer) {
      return fail("Customer not found.", 404);
    }

    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerSchema,
      payload || {},
    );

    if (errors) {
      return fail("Please check the customer form.", 422, errors);
    }

    const input = normalizeCustomerInput(data, business);
    const duplicateEmail = await prisma.customer.findFirst({
      where: {
        businessId: business.id,
        email: input.email,
        id: {
          not: customerId,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateEmail) {
      return fail("A customer with this email already exists.", 409, {
        email: "A customer with this email already exists.",
      });
    }

    const result = await prisma.customer.updateMany({
      where: {
        id: customerId,
        businessId: business.id,
      },
      data: input,
    });

    if (result.count === 0) {
      return fail("Customer not found.", 404);
    }

    return ok({
      customer: await findTenantCustomer({
        businessId: business.id,
        customerId,
      }),
      message: "Customer updated.",
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return fail("A customer with this email already exists.", 409, {
        email: "A customer with this email already exists.",
      });
    }

    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { business, user } = await requireCustomerContext(
      getRequestedBusinessId(request),
    );
    assertCustomerWriteAccess(user, business);
    const { customerId } = await params;
    const customer = await findTenantCustomer({
      businessId: business.id,
      customerId,
      select: {
        id: true,
        userId: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!customer) {
      return fail("Customer not found.", 404);
    }

    if (customer.userId) {
      return fail(
        "A customer linked to a user account cannot be deleted.",
        409,
      );
    }

    if (customer._count.bookings > 0) {
      return fail(
        "Customers with booking history cannot be deleted. Keep the profile for historical integrity.",
        409,
      );
    }

    const result = await prisma.customer.deleteMany({
      where: {
        id: customerId,
        businessId: business.id,
      },
    });

    if (result.count === 0) {
      return fail("Customer not found.", 404);
    }

    return ok({
      customerId,
      message: "Customer deleted.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
