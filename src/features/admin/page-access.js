import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/features/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";

export async function requireSuperAdminPageSession() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isSuperAdmin(session.user)) {
    redirect("/dashboard");
  }

  return session;
}
