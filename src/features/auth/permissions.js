import { BUSINESS_ROLES, PLATFORM_ROLES } from "@/constants/roles";
import { ForbiddenError } from "@/lib/api/errors";

export function isSuperAdmin(user) {
  return user?.platformRole === PLATFORM_ROLES.SUPER_ADMIN;
}

export function isPlatformAdmin(user) {
  return user?.platformRole === PLATFORM_ROLES.ADMIN || isSuperAdmin(user);
}

export function isBusinessOwner(user) {
  return user?.businessRole === BUSINESS_ROLES.OWNER;
}

export function isBusinessAdmin(user) {
  return user?.businessRole === BUSINESS_ROLES.ADMIN;
}

export function isBusinessStaff(user) {
  return user?.businessRole === BUSINESS_ROLES.STAFF;
}

export function isCustomer(user) {
  return Boolean(user?.customerId);
}

export function canAccessDashboard(user) {
  return isSuperAdmin(user) || Boolean(user?.activeBusinessId && user?.businessRole);
}

export function needsBusinessOnboarding(user) {
  return Boolean(user?.id && !isSuperAdmin(user) && !user?.businessRole);
}

export function canAccessBusiness(user, businessId) {
  if (!user || !businessId) {
    return false;
  }

  return isSuperAdmin(user) || user.activeBusinessId === businessId;
}

export function canManageBusiness(user, businessId) {
  if (!canAccessBusiness(user, businessId)) {
    return false;
  }

  return isSuperAdmin(user) || [BUSINESS_ROLES.OWNER, BUSINESS_ROLES.ADMIN].includes(user.businessRole);
}

export function assertBusinessAccess(user, businessId) {
  if (!canAccessBusiness(user, businessId)) {
    throw new ForbiddenError("You cannot access records for this business.");
  }
}

export function assertBusinessManagement(user, businessId) {
  if (!canManageBusiness(user, businessId)) {
    throw new ForbiddenError("You cannot manage records for this business.");
  }
}

export function assertBusinessWriteAccess(user, business) {
  assertBusinessManagement(user, business?.id);

  if (!isSuperAdmin(user) && business.status !== "ACTIVE") {
    throw new ForbiddenError(
      "This business is suspended. Configuration is available in read-only mode."
    );
  }
}

export function assertSuperAdmin(user) {
  if (!isSuperAdmin(user)) {
    throw new ForbiddenError("Super admin access is required.");
  }
}

export function getAuthorizationSummary(user) {
  return {
    isAuthenticated: Boolean(user?.id),
    isSuperAdmin: isSuperAdmin(user),
    isPlatformAdmin: isPlatformAdmin(user),
    isBusinessOwner: isBusinessOwner(user),
    isBusinessAdmin: isBusinessAdmin(user),
    isBusinessStaff: isBusinessStaff(user),
    isCustomer: isCustomer(user),
    canAccessAdmin: isSuperAdmin(user),
    canAccessDashboard: canAccessDashboard(user),
    needsBusinessOnboarding: needsBusinessOnboarding(user),
    activeBusinessId: user?.activeBusinessId || null,
    activeBusinessMembershipId: user?.activeBusinessMembershipId || null,
    activeBusinessStatus: user?.activeBusinessStatus || null,
    businessRole: user?.businessRole || null,
    customerId: user?.customerId || null,
    customerBusinessId: user?.customerBusinessId || null
  };
}
