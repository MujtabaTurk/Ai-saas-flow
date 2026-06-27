import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "./normalize-email";
import { verifyPassword } from "./password";
import { resolveSessionContext } from "./session-context";
import { loginSchema } from "./validation/login-schema";

export const googleIdentityClientId = process.env.GOOGLE_CLIENT_ID || null;

export const isGoogleProviderEnabled = Boolean(
  googleIdentityClientId && process.env.GOOGLE_CLIENT_SECRET
);

function isObject(value) {
  return Boolean(value && typeof value === "object");
}

function invalidateMissingUserToken(token = {}) {
  return {
    ...token,
    id: null,
    accountMissing: true,
    emailVerified: null,
    activeBusinessId: null,
    activeBusinessMembershipId: null,
    activeBusinessSlug: null,
    activeBusinessName: null,
    activeBusinessStatus: null,
    businessRole: null,
    customerRole: null,
    customerId: null,
    customerBusinessId: null,
    customerProfileCount: 0
  };
}

const providers = [
  CredentialsProvider({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const parsedCredentials = await loginSchema.validate(credentials || {}, {
        abortEarly: false,
        stripUnknown: true
      });
      const email = normalizeEmail(parsedCredentials.email);
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password.");
      }

      const isValidPassword = await verifyPassword(parsedCredentials.password, user.passwordHash);

      if (!isValidPassword) {
        throw new Error("Invalid email or password.");
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        platformRole: user.platformRole
      };
    }
  })
];

if (isGoogleProviderEnabled) {
  providers.push(
    GoogleProvider({
      clientId: googleIdentityClientId,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        const email = normalizeEmail(profile.email);

        if (!email || profile.email_verified !== true) {
          throw new Error("A verified Google email address is required.");
        }

        return {
          id: profile.sub,
          name: profile.name,
          email,
          image: profile.picture,
          emailVerified: new Date()
        };
      }
    })
  );
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const safeToken = isObject(token) ? token : {};
      const userId = user?.id || safeToken.id;

      if (userId) {
        safeToken.id = userId;

        const context = await resolveSessionContext(userId, {
          preferredBusinessId:
            trigger === "update" ? session?.activeBusinessId : null
        });

        if (!context) {
          return invalidateMissingUserToken(safeToken);
        }

        safeToken.accountMissing = false;
        safeToken.platformRole =
          context.platformRole || user?.platformRole || safeToken.platformRole || "USER";
        safeToken.emailVerified = context.emailVerified
          ? new Date(context.emailVerified).toISOString()
          : null;
        safeToken.activeBusinessId = context.activeBusinessId;
        safeToken.activeBusinessMembershipId = context.activeBusinessMembershipId;
        safeToken.activeBusinessSlug = context.activeBusinessSlug;
        safeToken.activeBusinessName = context.activeBusinessName;
        safeToken.activeBusinessStatus = context.activeBusinessStatus;
        safeToken.businessRole = context.businessRole;
        safeToken.customerRole = context.customerRole;
        safeToken.customerId = context.customerId;
        safeToken.customerBusinessId = context.customerBusinessId;
        safeToken.customerProfileCount = context.customerProfileCount || 0;
      }

      return safeToken;
    },
    async session({ session, token }) {
      if (!isObject(token) || !token.id || token.accountMissing) {
        return {};
      }

      const safeSession = isObject(session) ? session : {};
      const safeUser = isObject(safeSession.user) ? safeSession.user : {};

      safeSession.user = safeUser;
      safeSession.user.id = token.id;
      safeSession.user.platformRole = token.platformRole || "USER";
      safeSession.user.emailVerified = token.emailVerified || null;
      safeSession.user.activeBusinessId = token.activeBusinessId || null;
      safeSession.user.activeBusinessMembershipId =
        token.activeBusinessMembershipId || null;
      safeSession.user.activeBusinessSlug = token.activeBusinessSlug || null;
      safeSession.user.activeBusinessName = token.activeBusinessName || null;
      safeSession.user.activeBusinessStatus = token.activeBusinessStatus || null;
      safeSession.user.businessRole = token.businessRole || null;
      safeSession.user.customerRole = token.customerRole || null;
      safeSession.user.customerId = token.customerId || null;
      safeSession.user.customerBusinessId = token.customerBusinessId || null;
      safeSession.user.customerProfileCount = token.customerProfileCount || 0;

      return safeSession;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
