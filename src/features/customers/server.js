import {
  assertBusinessManagement,
  assertBusinessWriteAccess,
  isSuperAdmin
} from "@/features/auth/permissions";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const customerSelect = {
  id: true,
  businessId: true,
  name: true,
  email: true,
  phone: true,
  notes: true,
  locale: true,
  timezone: true,
  marketingOptIn: true,
  createdAt: true,
  updatedAt: true
};

export const customerListSelect = {
  id: true,
  businessId: true,
  name: true,
  email: true,
  phone: true,
  locale: true,
  timezone: true,
  marketingOptIn: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      bookings: true
    }
  },
  bookings: {
    orderBy: {
      startsAt: "desc"
    },
    take: 1,
    select: {
      id: true,
      bookingNumber: true,
      serviceNameSnapshot: true,
      startsAt: true,
      status: true
    }
  }
};

export const customerBookingSelect = {
  id: true,
  bookingNumber: true,
  serviceNameSnapshot: true,
  serviceDurationMinSnapshot: true,
  servicePriceCentsSnapshot: true,
  serviceCurrencySnapshot: true,
  paymentRequiredSnapshot: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  status: true,
  source: true,
  notes: true,
  cancellationReason: true,
  createdAt: true
};

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function requireCustomerContext(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or an explicit business selection is required before managing customers.",
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
      status: true,
      timezone: true,
      locale: true
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

export function buildCustomerAccess(user, business) {
  const isReadOnly = business.status !== "ACTIVE" && !isSuperAdmin(user);

  return {
    businessStatus: business.status,
    isReadOnly,
    canManage: !isReadOnly
  };
}

export function assertCustomerWriteAccess(user, business) {
  assertBusinessWriteAccess(user, business);
}

export async function findTenantCustomer({
  businessId,
  customerId,
  select = customerSelect
}) {
  if (!isValidMongoObjectId(customerId)) {
    return null;
  }

  return prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId
    },
    select
  });
}

export function normalizeCustomerInput(data, business) {
  return {
    name: data.name.trim(),
    email: normalizeEmail(data.email),
    phone: data.phone?.trim() || null,
    notes: data.notes?.trim() || null,
    locale: data.locale || business.locale,
    timezone: data.timezone || business.timezone,
    marketingOptIn: Boolean(data.marketingOptIn)
  };
}

export function mapCustomerListItem(customer) {
  return {
    ...customer,
    bookingCount: customer._count.bookings,
    lastBooking: customer.bookings[0] || null,
    _count: undefined,
    bookings: undefined
  };
}
