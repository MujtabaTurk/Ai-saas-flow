import { assertSuperAdmin } from "@/features/auth/permissions";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";

export const ADMIN_DEFAULT_PAGE_SIZE = 25;
export const ADMIN_MAX_PAGE_SIZE = 100;

export async function requireSuperAdminContext() {
  const user = await requireCurrentUser();
  assertSuperAdmin(user);

  return {
    user
  };
}

export function getAdminPagination(searchParams) {
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(
    searchParams.get("pageSize") || ADMIN_DEFAULT_PAGE_SIZE
  );

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > ADMIN_MAX_PAGE_SIZE
  ) {
    return null;
  }

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize
  };
}

export function buildAdminPagination({ page, pageSize, totalItems }) {
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

export function isAdminRecordId(value) {
  return isValidMongoObjectId(value);
}
