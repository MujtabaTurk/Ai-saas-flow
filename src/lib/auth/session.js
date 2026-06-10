import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth/auth-options";
import { AppError } from "@/lib/api/errors";

export function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    throw new AppError("Authentication is required.", 401);
  }

  return session;
}

export async function requireCurrentUser() {
  const session = await requireSession();

  return session.user;
}

