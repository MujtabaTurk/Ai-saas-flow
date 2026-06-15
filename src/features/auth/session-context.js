import { prisma } from "@/lib/prisma";
import { isValidMongoObjectId } from "@/lib/mongodb";

const businessSelect = {
  id: true,
  name: true,
  slug: true,
  status: true
};

function buildBusinessContext({
  platformRole,
  business,
  businessRole,
  membershipId = null
}) {
  return {
    platformRole,
    activeBusinessId: business.id,
    activeBusinessMembershipId: membershipId,
    activeBusinessSlug: business.slug,
    activeBusinessName: business.name,
    activeBusinessStatus: business.status,
    businessRole,
    customerId: null,
    customerBusinessId: null
  };
}

async function resolvePreferredBusinessContext({
  userId,
  platformRole,
  preferredBusinessId
}) {
  if (!isValidMongoObjectId(preferredBusinessId)) {
    return null;
  }

  const business = await prisma.business.findUnique({
    where: {
      id: preferredBusinessId
    },
    select: {
      ...businessSelect,
      ownerId: true,
      memberships: {
        where: {
          userId,
          isActive: true
        },
        take: 1,
        select: {
          id: true,
          role: true
        }
      }
    }
  });

  if (!business || business.status === "ARCHIVED") {
    return null;
  }

  if (business.ownerId === userId) {
    return buildBusinessContext({
      platformRole,
      business,
      businessRole: "OWNER"
    });
  }

  const membership = business.memberships[0];

  if (!membership) {
    return null;
  }

  return buildBusinessContext({
    platformRole,
    business,
    businessRole: membership.role,
    membershipId: membership.id
  });
}

export async function resolveSessionContext(
  userId,
  { preferredBusinessId = null } = {}
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      platformRole: true
    }
  });

  if (!user) {
    return null;
  }

  const platformRole = user.platformRole;
  const preferredContext = await resolvePreferredBusinessContext({
    userId,
    platformRole,
    preferredBusinessId
  });

  if (preferredContext) {
    return preferredContext;
  }

  const business = await prisma.business.findFirst({
    where: {
      ownerId: userId,
      status: {
        not: "ARCHIVED"
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    select: businessSelect
  });

  if (business) {
    return buildBusinessContext({
      platformRole,
      business,
      businessRole: "OWNER"
    });
  }

  const membership = await prisma.businessMembership.findFirst({
    where: {
      userId,
      isActive: true,
      business: {
        status: {
          not: "ARCHIVED"
        }
      }
    },
    orderBy: {
      joinedAt: "asc"
    },
    select: {
      id: true,
      role: true,
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    }
  });

  if (membership) {
    return buildBusinessContext({
      platformRole,
      business: membership.business,
      businessRole: membership.role,
      membershipId: membership.id
    });
  }

  const customer = await prisma.customer.findFirst({
    where: {
      userId
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      businessId: true
    }
  });

  return {
    platformRole,
    activeBusinessId: null,
    activeBusinessMembershipId: null,
    activeBusinessSlug: null,
    activeBusinessName: null,
    activeBusinessStatus: null,
    businessRole: null,
    customerId: customer?.id || null,
    customerBusinessId: customer?.businessId || null
  };
}
