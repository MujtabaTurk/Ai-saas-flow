import { redirect } from "next/navigation";
import {
  buildAuthUrl,
  getSafeCallbackUrl
} from "@/features/auth/callback-url";
import { isCustomer, isSuperAdmin } from "@/features/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";

function isAuthenticationCallback(callbackUrl) {
  return (
    callbackUrl === "/login" ||
    callbackUrl?.startsWith("/login?") ||
    callbackUrl === "/auth/continue" ||
    callbackUrl?.startsWith("/auth/continue?")
  );
}

export default async function AuthenticationContinuePage({
  searchParams
}) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = getSafeCallbackUrl(
    resolvedSearchParams?.callbackUrl
  );
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect(
      buildAuthUrl("/login", {
        callbackUrl
      })
    );
  }

  if (isSuperAdmin(session.user)) {
    redirect("/admin");
  }

  if (
    callbackUrl &&
    !isAuthenticationCallback(callbackUrl)
  ) {
    redirect(callbackUrl);
  }

  if (session.user.activeBusinessId && session.user.businessRole) {
    redirect("/dashboard");
  }

  if (isCustomer(session.user)) {
    redirect("/customer");
  }

  redirect("/onboarding");
}
