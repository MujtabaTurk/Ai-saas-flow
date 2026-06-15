import "server-only";

import { normalizeEmail } from "@/features/auth/normalize-email";
import { hashToken } from "@/features/auth/password";
import { prisma } from "@/lib/prisma";

const publicInvitationSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  business: {
    select: {
      name: true,
      slug: true
    }
  }
};

export async function findTeamInvitationByToken(token, select) {
  if (typeof token !== "string" || !token.trim()) {
    return null;
  }

  return prisma.teamInvitation.findUnique({
    where: {
      tokenHash: hashToken(token.trim())
    },
    select
  });
}

export async function expireTeamInvitationIfNeeded(
  invitation,
  now = new Date()
) {
  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt > now
  ) {
    return invitation;
  }

  await prisma.teamInvitation.updateMany({
    where: {
      id: invitation.id,
      status: "PENDING",
      expiresAt: {
        lte: now
      }
    },
    data: {
      status: "EXPIRED"
    }
  });

  return {
    ...invitation,
    status: "EXPIRED"
  };
}

export async function getPublicTeamInvitation(token) {
  const foundInvitation = await findTeamInvitationByToken(
    token,
    publicInvitationSelect
  );

  if (!foundInvitation) {
    return null;
  }

  const invitation = await expireTeamInvitationIfNeeded(foundInvitation);
  const account = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(invitation.email)
    },
    select: {
      id: true
    }
  });

  return {
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    accountExists: Boolean(account),
    business: invitation.business
  };
}
