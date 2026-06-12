import {
  assertBusinessAccess,
  assertBusinessWriteAccess,
  isSuperAdmin
} from "@/features/auth/permissions";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { getSubscriptionEntitlement } from "@/features/billing/status";
import {
  getTeamMemberLimit,
  getTeamSeatUsage
} from "@/features/team/policy";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireCurrentUser } from "@/lib/auth/session";
import { isValidMongoObjectId } from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";

export const TEAM_INVITATION_DAYS = 7;

export const teamInvitationSelect = {
  id: true,
  businessId: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  acceptedAt: true,
  createdAt: true,
  updatedAt: true,
  invitedBy: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
};

export const teamMemberSelect = {
  id: true,
  businessId: true,
  userId: true,
  role: true,
  isActive: true,
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    }
  },
  serviceAssignments: {
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      serviceId: true,
      service: {
        select: {
          id: true,
          name: true,
          isActive: true
        }
      }
    }
  },
  availability: {
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      isActive: true
    }
  },
  _count: {
    select: {
      assignedBookings: true
    }
  }
};

export function getRequestedBusinessId(request) {
  return new URL(request.url).searchParams.get("businessId");
}

export async function requireTeamContext(requestedBusinessId = null) {
  const user = await requireCurrentUser();
  const businessId = requestedBusinessId || user.activeBusinessId;

  if (!businessId) {
    throw new AppError(
      "Business onboarding or team membership is required before managing a team.",
      409
    );
  }

  if (!isValidMongoObjectId(businessId)) {
    throw new AppError("Choose a valid business.", 422);
  }

  assertBusinessAccess(user, businessId);
  const business = await prisma.business.findUnique({
    where: {
      id: businessId
    },
    select: {
      id: true,
      ownerId: true,
      name: true,
      slug: true,
      status: true,
      timezone: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      subscriptions: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        select: {
          planCode: true,
          status: true,
          currentPeriodEnd: true,
          trialEndsAt: true
        }
      }
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

export function assertTeamManagement(user, business) {
  const canManage =
    isSuperAdmin(user) ||
    (user.activeBusinessId === business.id && user.businessRole === "OWNER");

  if (!canManage) {
    throw new ForbiddenError("Only the business owner can manage the team.");
  }
}

export function assertTeamWriteAccess(user, business) {
  assertTeamManagement(user, business);
  assertBusinessWriteAccess(user, business);
  const entitlement = getSubscriptionEntitlement(business.subscriptions?.[0]);

  if (!isSuperAdmin(user) && !entitlement.isEntitled) {
    throw new AppError(
      "An active subscription is required before changing the team.",
      402
    );
  }

  return entitlement;
}

export function buildTeamAccess({ user, business, usage }) {
  const entitlement = getSubscriptionEntitlement(business.subscriptions?.[0]);
  const canManage =
    isSuperAdmin(user) ||
    (user.activeBusinessId === business.id && user.businessRole === "OWNER");
  const isReadOnly = !isSuperAdmin(user) && business.status !== "ACTIVE";
  const canWrite =
    canManage &&
    !isReadOnly &&
    (isSuperAdmin(user) || entitlement.isEntitled);

  return {
    canManage,
    canWrite,
    canInvite: canWrite && usage.hasCapacity,
    isReadOnly,
    businessStatus: business.status,
    subscriptionEntitled: entitlement.isEntitled,
    subscriptionStatus: entitlement.status,
    entitlementReason: entitlement.reason,
    currentRole: user.businessRole || null,
    currentMembershipId: user.activeBusinessMembershipId || null
  };
}

export async function expirePendingInvitations(businessId, now = new Date()) {
  await prisma.teamInvitation.updateMany({
    where: {
      businessId,
      status: "PENDING",
      expiresAt: {
        lte: now
      }
    },
    data: {
      status: "EXPIRED"
    }
  });
}

export async function getTeamUsage(business, now = new Date()) {
  await expirePendingInvitations(business.id, now);
  const [activeMemberships, pendingInvitations] = await Promise.all([
    prisma.businessMembership.count({
      where: {
        businessId: business.id,
        isActive: true
      }
    }),
    prisma.teamInvitation.count({
      where: {
        businessId: business.id,
        status: "PENDING",
        expiresAt: {
          gt: now
        }
      }
    })
  ]);
  const planCode = business.subscriptions?.[0]?.planCode || "TRIAL";
  const limit = getTeamMemberLimit(planCode);
  const used = getTeamSeatUsage({
    activeMemberships,
    pendingInvitations
  });

  return {
    planCode,
    limit,
    used,
    activeMemberships,
    pendingInvitations,
    remaining: limit === null ? null : Math.max(limit - used, 0),
    hasCapacity: limit === null || used < limit
  };
}

export async function findTenantMember({
  businessId,
  membershipId,
  select = teamMemberSelect
}) {
  if (!isValidMongoObjectId(membershipId)) {
    return null;
  }

  return prisma.businessMembership.findFirst({
    where: {
      id: membershipId,
      businessId
    },
    select
  });
}

export async function findTenantInvitation({
  businessId,
  invitationId,
  select = teamInvitationSelect
}) {
  if (!isValidMongoObjectId(invitationId)) {
    return null;
  }

  return prisma.teamInvitation.findFirst({
    where: {
      id: invitationId,
      businessId
    },
    select
  });
}

export async function getTeamSnapshot({ user, business }) {
  const usage = await getTeamUsage(business);
  const [members, invitations, services] = await Promise.all([
    prisma.businessMembership.findMany({
      where: {
        businessId: business.id,
        isActive: true
      },
      orderBy: {
        joinedAt: "asc"
      },
      select: teamMemberSelect
    }),
    prisma.teamInvitation.findMany({
      where: {
        businessId: business.id,
        status: "PENDING",
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      select: teamInvitationSelect
    }),
    prisma.service.findMany({
      where: {
        businessId: business.id
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true
      }
    })
  ]);

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      status: business.status,
      timezone: business.timezone
    },
    owner: {
      ...business.owner,
      role: "OWNER",
      isActive: true
    },
    members,
    invitations,
    services,
    usage,
    access: buildTeamAccess({
      user,
      business,
      usage
    })
  };
}

export async function assertServiceAssignmentsBelongToBusiness(
  serviceIds,
  businessId
) {
  const uniqueServiceIds = [...new Set(serviceIds)];

  if (uniqueServiceIds.length === 0) {
    return uniqueServiceIds;
  }

  const count = await prisma.service.count({
    where: {
      businessId,
      id: {
        in: uniqueServiceIds
      }
    }
  });

  if (count !== uniqueServiceIds.length) {
    throw new AppError("One or more services do not belong to this business.", 422);
  }

  return uniqueServiceIds;
}

export function assertNoStaffAvailabilityOverlap(availability) {
  for (const [index, window] of availability.entries()) {
    const overlap = availability.some(
      (candidate, candidateIndex) =>
        candidateIndex !== index &&
        candidate.dayOfWeek === window.dayOfWeek &&
        candidate.isActive !== false &&
        window.isActive !== false &&
        candidate.startTime < window.endTime &&
        candidate.endTime > window.startTime
    );

    if (overlap) {
      throw new AppError(
        "Team working-hour ranges cannot overlap on the same day.",
        409
      );
    }
  }
}

export function canMemberDeliverService(member, serviceId) {
  return member.serviceAssignments.some(
    (assignment) => assignment.serviceId === serviceId
  );
}

export function normalizeTeamEmail(value) {
  return normalizeEmail(value);
}
