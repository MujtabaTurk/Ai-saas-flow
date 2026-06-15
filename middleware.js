import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

function hasDashboardAccess(token) {
  return token?.platformRole === "SUPER_ADMIN" || Boolean(token?.activeBusinessId && token?.businessRole);
}

function redirectToLogin(request) {
  const loginUrl = new URL("/login", request.url);
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

  if (
    AUTH_ROUTES.includes(pathname) &&
    hasUsableToken &&
    pathname !== "/reset-password" &&
    !isInvitationAuthentication(request)
  ) {
    return redirectForAuthenticatedUser(request, token);
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
  matcher: ["/login", "/register", "/forgot-password", "/reset-password", "/dashboard/:path*", "/admin/:path*", "/onboarding/:path*"]
};
