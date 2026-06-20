import { normalizeEmail } from "@/features/auth/normalize-email";
import { prisma } from "@/lib/prisma";

const unclaimedCustomerWhere = {
  OR: [
    {
      userId: null
    },
    {
      userId: {
        isSet: false
      }
    }
  ]
};

export function buildUnclaimedCustomerEmailWhere(email) {
  return {
    email: normalizeEmail(email),
    ...unclaimedCustomerWhere
  };
}

export async function findVerifiedCustomerAccountByEmail(
  email,
  { client = prisma } = {}
) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const user = await client.user.findUnique({
    where: {
      email: normalizedEmail
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      customerPortalEnabled: true
    }
  });

  if (!user?.emailVerified) {
    return null;
  }

  return user;
}

export async function claimCustomerProfilesForVerifiedUser(
  user,
  { client = prisma } = {}
) {
  if (!user?.id || !user.email || !user.emailVerified) {
    return {
      claimedCount: 0,
      email: user?.email ? normalizeEmail(user.email) : null
    };
  }

  const email = normalizeEmail(user.email);
  const result = await client.customer.updateMany({
    where: buildUnclaimedCustomerEmailWhere(email),
    data: {
      userId: user.id
    }
  });

  return {
    claimedCount: result.count,
    email
  };
}

export async function claimCustomerProfilesForVerifiedUserId(
  userId,
  { client = prisma } = {}
) {
  if (!userId) {
    return {
      claimedCount: 0,
      email: null
    };
  }

  const user = await client.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      email: true,
      emailVerified: true
    }
  });

  return claimCustomerProfilesForVerifiedUser(user, { client });
}

export async function buildVerifiedCustomerLinkDataForEmail(
  email,
  { client = prisma } = {}
) {
  const user = await findVerifiedCustomerAccountByEmail(email, { client });

  return user
    ? {
        userId: user.id
      }
    : {};
}

export async function attachCustomerProfileToVerifiedAccount({
  customerId,
  email,
  client = prisma
}) {
  if (!customerId) {
    return {
      attached: false,
      userId: null
    };
  }

  const user = await findVerifiedCustomerAccountByEmail(email, { client });

  if (!user) {
    return {
      attached: false,
      userId: null
    };
  }

  const result = await client.customer.updateMany({
    where: {
      id: customerId,
      ...unclaimedCustomerWhere
    },
    data: {
      userId: user.id
    }
  });

  return {
    attached: result.count > 0,
    userId: user.id
  };
}
