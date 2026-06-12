import { prisma } from "@/lib/prisma";

export async function resolveSessionContext(userId) {
  const [user, business] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        platformRole: true
      }
    }),
    prisma.business.findFirst({
      where: {
        ownerId: userId,
        status: {
          not: "ARCHIVED"
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true
      }
    })
  ]);

  const platformRole = user?.platformRole || "USER";

  if (business) {
    return {
      platformRole,
      activeBusinessId: business.id,
      activeBusinessMembershipId: null,
      activeBusinessSlug: business.slug,
      activeBusinessName: business.name,
      activeBusinessStatus: business.status,
      businessRole: "OWNER",
      customerId: null,
      customerBusinessId: null
    };
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
    return {
      platformRole,
      activeBusinessId: membership.business.id,
      activeBusinessMembershipId: membership.id,
      activeBusinessSlug: membership.business.slug,
      activeBusinessName: membership.business.name,
      activeBusinessStatus: membership.business.status,
      businessRole: membership.role,
      customerId: null,
      customerBusinessId: null
    };
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
