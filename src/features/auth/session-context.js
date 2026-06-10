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
      activeBusinessSlug: business.slug,
      activeBusinessName: business.name,
      activeBusinessStatus: business.status,
      businessRole: "OWNER",
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
    activeBusinessSlug: null,
    activeBusinessName: null,
    activeBusinessStatus: null,
    businessRole: null,
    customerId: customer?.id || null,
    customerBusinessId: customer?.businessId || null
  };
}
