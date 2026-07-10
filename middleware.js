import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const CUSTOMER_AUTH_ROUTES = [
  "/customer/login",
  "/customer/register",
  "/customer/forgot-password",
  "/customer/reset-password",
  "/customer/verify-email"
];
const CUSTOMER_AUTH_PASSTHROUGH_ROUTES = [
  "/customer/reset-password",
  "/customer/verify-email"
];

function hasUsableToken(token) {
  return Boolean(token?.id && !token?.accountMissing);
}

function hasDashboardAccess(token) {
  return token?.platformRole === "SUPER_ADMIN" || Boolean(token?.activeBusinessId && token?.businessRole);
}

function hasCustomerAccess(token) {
  return Boolean(
    token?.customerRole ||
    token?.customerId ||
    token?.customerProfileCount > 0
  );
}

function redirectTo(request, pathname) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function redirectToLogin(request, pathname = "/login") {
  const loginUrl = new URL(pathname, request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

function redirectForAuthenticatedUser(request, token) {
  if (token?.platformRole === "SUPER_ADMIN") {
    return redirectTo(request, "/admin");
  }

  if (hasDashboardAccess(token)) {
    return redirectTo(request, "/dashboard");
  }

  if (hasCustomerAccess(token)) {
    return redirectTo(request, "/customer");
  }

  return redirectTo(request, "/onboarding");
}

function isInvitationAuthentication(request) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");

  return (
    callbackUrl === "/invite/accept" ||
    callbackUrl?.startsWith("/invite/accept?")
  );
}

function getAuthenticatedAuthRedirect(request, pathname, token) {
  if (
    AUTH_ROUTES.includes(pathname) &&
    pathname !== "/reset-password" &&
    !isInvitationAuthentication(request)
  ) {
    return redirectForAuthenticatedUser(request, token);
  }

  if (
    CUSTOMER_AUTH_ROUTES.includes(pathname) &&
    !CUSTOMER_AUTH_PASSTHROUGH_ROUTES.includes(pathname)
  ) {
    return redirectTo(request, "/customer");
  }

  return null;
}

function guardAdminRoute(request, pathname, token, authenticated) {
  if (!pathname.startsWith("/admin")) {
    return null;
  }

  if (!authenticated) {
    return redirectToLogin(request);
  }

  if (token.platformRole !== "SUPER_ADMIN") {
    return redirectTo(
      request,
      token.activeBusinessId ? "/dashboard" : "/onboarding"
    );
  }

  return null;
}

function guardDashboardRoute(request, pathname, token, authenticated) {
  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  if (!authenticated) {
    return redirectToLogin(request);
  }

  if (token.platformRole === "SUPER_ADMIN") {
    return redirectTo(request, "/admin");
  }

  if (!hasDashboardAccess(token)) {
    return redirectTo(request, "/onboarding");
  }

  return null;
}

function guardCustomerRoute(request, pathname, authenticated) {
  if (
    !pathname.startsWith("/customer") ||
    CUSTOMER_AUTH_ROUTES.includes(pathname)
  ) {
    return null;
  }

  if (!authenticated) {
    return redirectToLogin(request, "/customer/login");
  }

  return null;
}

function guardOnboardingRoute(request, pathname, token, authenticated) {
  if (!pathname.startsWith("/onboarding")) {
    return null;
  }

  if (!authenticated) {
    return redirectToLogin(request);
  }

  if (token.platformRole === "SUPER_ADMIN") {
    return redirectTo(request, "/admin");
  }

  if (hasDashboardAccess(token)) {
    return redirectTo(request, "/dashboard");
  }

  return null;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  const authenticated = hasUsableToken(token);

  if (authenticated) {
    const authRedirect = getAuthenticatedAuthRedirect(request, pathname, token);

    if (authRedirect) {
      return authRedirect;
    }
  }

  const protectedRouteRedirect =
    guardAdminRoute(request, pathname, token, authenticated) ||
    guardDashboardRoute(request, pathname, token, authenticated) ||
    guardCustomerRoute(request, pathname, authenticated) ||
    guardOnboardingRoute(request, pathname, token, authenticated);

  if (protectedRouteRedirect) {
    return protectedRouteRedirect;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/forgot-password", "/reset-password", "/customer/:path*", "/dashboard/:path*", "/admin/:path*", "/onboarding/:path*"]
};
