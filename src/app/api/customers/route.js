import {
  assertCustomerWriteAccess,
  buildCustomerAccess,
  customerListSelect,
  getRequestedBusinessId,
  mapCustomerListItem,
  normalizeCustomerInput,
  requireCustomerContext
} from "@/features/customers/server";
import { buildCustomerSummary } from "@/features/customers/summary";
import { customerSchema } from "@/features/customers/validation/customer-schema";
import { created, fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MARKETING_FILTERS = ["ALL", "OPTED_IN", "NOT_OPTED_IN"];
const CUSTOMER_SORTS = {
  CREATED_DESC: {
    createdAt: "desc"
  },
  CREATED_ASC: {
    createdAt: "asc"
  },
  UPDATED_DESC: {
    updatedAt: "desc"
  },
  NAME_ASC: {
    name: "asc"
  }
};

export async function GET(request) {
  try {
    const { business, user } = await requireCustomerContext(
      getRequestedBusinessId(request)
    );
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const marketing = searchParams.get("marketing") || "ALL";
    const sort = searchParams.get("sort") || "CREATED_DESC";
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(
      searchParams.get("pageSize") || DEFAULT_PAGE_SIZE
    );

    if (search && search.length > 100) {
      return fail("Search must be 100 characters or fewer.", 422, {
        search: "Search must be 100 characters or fewer."
      });
    }

    if (!MARKETING_FILTERS.includes(marketing)) {
      return fail("Choose a valid marketing consent filter.", 422, {
        marketing: "Choose a valid marketing consent filter."
      });
    }

    if (!CUSTOMER_SORTS[sort]) {
      return fail("Choose a valid customer sort order.", 422, {
        sort: "Choose a valid customer sort order."
      });
    }

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_PAGE_SIZE
    ) {
      return fail("Choose valid customer pagination values.", 422, {
        page: "Page must be a positive whole number.",
        pageSize: `Page size must be between 1 and ${MAX_PAGE_SIZE}.`
      });
    }

    const customerWhere = {
      businessId: business.id,
      ...(marketing === "OPTED_IN"
        ? {
            marketingOptIn: true
          }
        : {}),
      ...(marketing === "NOT_OPTED_IN"
        ? {
            marketingOptIn: false
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                phone: {
                  contains: search,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {})
    };

    const [customers, summary] = await Promise.all([
      prisma.customer.findMany({
        where: customerWhere,
        orderBy: CUSTOMER_SORTS[sort],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: customerListSelect
      }),
      buildCustomerSummary({
        business,
        filteredWhere: customerWhere
      })
    ]);
    const totalPages = Math.max(
      Math.ceil(summary.filteredTotal / pageSize),
      1
    );

    return ok({
      customers: customers.map(mapCustomerListItem),
      summary,
      access: buildCustomerAccess(user, business),
      pagination: {
        page,
        pageSize,
        totalItems: summary.filteredTotal,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const { business, user } = await requireCustomerContext(
      getRequestedBusinessId(request)
    );
    assertCustomerWriteAccess(user, business);
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(
      customerSchema,
      payload || {}
    );

    if (errors) {
      return fail("Please check the customer form.", 422, errors);
    }

    const input = normalizeCustomerInput(data, business);
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        businessId_email: {
          businessId: business.id,
          email: input.email
        }
      },
      select: {
        id: true
      }
    });

    if (existingCustomer) {
      return fail("A customer with this email already exists.", 409, {
        email: "A customer with this email already exists."
      });
    }

    const customer = await prisma.customer.create({
      data: {
        ...input,
        businessId: business.id
      },
      select: customerListSelect
    });

    return created({
      customer: mapCustomerListItem(customer),
      message: "Customer created."
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return fail("A customer with this email already exists.", 409, {
        email: "A customer with this email already exists."
      });
    }

    return handleApiError(error);
  }
}
