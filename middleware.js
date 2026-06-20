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

function redirectToLogin(request, pathname = "/login") {
  const loginUrl = new URL(pathname, request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

function redirectForAuthenticatedUser(request, token) {
  if (token?.platformRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (hasDashboardAccess(token)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (hasCustomerAccess(token)) {
    return NextResponse.redirect(new URL("/customer", request.url));
  }

  return NextResponse.redirect(new URL("/onboarding", request.url));
}

function isInvitationAuthentication(request) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");

  return (
    callbackUrl === "/invite/accept" ||
    callbackUrl?.startsWith("/invite/accept?")
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const hasUsableToken = Boolean(
    token?.id && !token?.accountMissing
  );

  if (hasUsableToken) {
    if (
      AUTH_ROUTES.includes(pathname) &&
      pathname !== "/reset-password" &&
      !isInvitationAuthentication(request)
    ) {
      return redirectForAuthenticatedUser(request, token);
    }

    if (
      CUSTOMER_AUTH_ROUTES.includes(pathname) &&
      !["/customer/reset-password", "/customer/verify-email"].includes(pathname)
    ) {
      return NextResponse.redirect(new URL("/customer", request.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!hasUsableToken) {
      return redirectToLogin(request);
    }

    if (token.platformRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(token.activeBusinessId ? "/dashboard" : "/onboarding", request.url));
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!hasUsableToken) {
      return redirectToLogin(request);
    }

    if (token.platformRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (!hasDashboardAccess(token)) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  if (
    pathname.startsWith("/customer") &&
    !CUSTOMER_AUTH_ROUTES.includes(pathname)
  ) {
    if (!hasUsableToken) {
      return redirectToLogin(request, "/customer/login");
    }
  }

  if (pathname.startsWith("/onboarding")) {
    if (!hasUsableToken) {
      return redirectToLogin(request);
    }

    if (token.platformRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (hasDashboardAccess(token)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/forgot-password", "/reset-password", "/customer/:path*", "/dashboard/:path*", "/admin/:path*", "/onboarding/:path*"]
};
