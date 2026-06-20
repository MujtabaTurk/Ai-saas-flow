import { randomBytes } from "crypto";
import { getPasswordResetUrlDiagnostics } from "@/features/auth/password-reset-url";
import { hashToken } from "@/features/auth/password";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { claimCustomerProfilesForVerifiedUser } from "@/features/customers/claiming";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const DEFAULT_VERIFICATION_PATH = "/customer/verify-email";

function isSafeRelativePath(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  );
}

export function createEmailVerificationToken() {
  const token = randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashToken(token)
  };
}

export function buildEmailVerificationUrl(
  token,
  {
    path = DEFAULT_VERIFICATION_PATH,
    callbackUrl = "/customer"
  } = {}
) {
  const diagnostics = getPasswordResetUrlDiagnostics();

  if (!diagnostics.ready) {
    return null;
  }

  const verificationUrl = new URL(
    isSafeRelativePath(path) ? path : DEFAULT_VERIFICATION_PATH,
    diagnostics.baseUrl
  );
  verificationUrl.searchParams.set("token", token);

  if (isSafeRelativePath(callbackUrl)) {
    verificationUrl.searchParams.set("callbackUrl", callbackUrl);
  }

  return verificationUrl.toString();
}

export async function createStoredEmailVerificationToken(email) {
  const normalizedEmail = normalizeEmail(email);
  const { token, tokenHash } = createEmailVerificationToken();
  const expires = new Date(
    Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
  );

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: tokenHash,
      expires
    }
  });

  return {
    token,
    tokenHash,
    expires
  };
}

export async function consumeEmailVerificationToken(token) {
  const tokenHash = hashToken(token);
  const now = new Date();
  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      token: tokenHash
    },
    select: {
      identifier: true,
      expires: true
    }
  });

  if (!verificationToken) {
    throw new AppError("This verification link is invalid.", 400, {
      token: "This verification link is invalid."
    });
  }

  if (verificationToken.expires <= now) {
    await prisma.verificationToken.deleteMany({
      where: {
        token: tokenHash
      }
    });

    throw new AppError("This verification link has expired.", 410, {
      token: "This verification link has expired."
    });
  }

  const email = normalizeEmail(verificationToken.identifier);
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      email: true,
      emailVerified: true
    }
  });

  if (!user) {
    throw new AppError("No account exists for this verification link.", 404, {
      token: "No account exists for this verification link."
    });
  }

  return prisma.$transaction(async (transaction) => {
    const verifiedAt = user.emailVerified || now;

    await transaction.user.update({
      where: {
        id: user.id
      },
      data: {
        emailVerified: verifiedAt
      }
    });

    const claimedCustomers = await claimCustomerProfilesForVerifiedUser(
      {
        ...user,
        email,
        emailVerified: verifiedAt
      },
      { client: transaction }
    );

    await transaction.verificationToken.deleteMany({
      where: {
        identifier: email
      }
    });

    return {
      email,
      linkedCustomerCount: claimedCustomers.claimedCount,
      verifiedAt
    };
  });
}
