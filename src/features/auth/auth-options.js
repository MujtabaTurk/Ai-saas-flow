import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "./normalize-email";
import { verifyPassword } from "./password";
import { resolveSessionContext } from "./session-context";
import { loginSchema } from "./validation/login-schema";

export const isGoogleProviderEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

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
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
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
    async jwt({ token, user }) {
      const userId = user?.id || token.id;

      if (userId) {
        token.id = userId;

        const context = await resolveSessionContext(userId);
        token.platformRole = context.platformRole || user?.platformRole || token.platformRole || "USER";
        token.activeBusinessId = context.activeBusinessId;
        token.activeBusinessSlug = context.activeBusinessSlug;
        token.activeBusinessName = context.activeBusinessName;
        token.activeBusinessStatus = context.activeBusinessStatus;
        token.businessRole = context.businessRole;
        token.customerId = context.customerId;
        token.customerBusinessId = context.customerBusinessId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.platformRole = token.platformRole || "USER";
        session.user.activeBusinessId = token.activeBusinessId || null;
        session.user.activeBusinessSlug = token.activeBusinessSlug || null;
        session.user.activeBusinessName = token.activeBusinessName || null;
        session.user.activeBusinessStatus = token.activeBusinessStatus || null;
        session.user.businessRole = token.businessRole || null;
        session.user.customerId = token.customerId || null;
        session.user.customerBusinessId = token.customerBusinessId || null;
      }

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
