import { appConfig } from "@/config/app";

function isLocalHostname(hostname) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

export function getPasswordResetUrlDiagnostics() {
  const configuredUrl = process.env.NEXTAUTH_URL || null;
  const issues = [];
  let parsedUrl = null;

  try {
    parsedUrl = new URL(appConfig.url);
  } catch {
    issues.push("NEXTAUTH_URL must be a valid absolute URL.");
  }

  if (process.env.NODE_ENV === "production" && !configuredUrl) {
    issues.push("NEXTAUTH_URL is required in production.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    parsedUrl &&
    parsedUrl.protocol !== "https:"
  ) {
    issues.push("NEXTAUTH_URL must use HTTPS in production.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    parsedUrl &&
    isLocalHostname(parsedUrl.hostname)
  ) {
    issues.push("NEXTAUTH_URL cannot point to localhost in production.");
  }

  return {
    configured: Boolean(configuredUrl),
    baseUrl: parsedUrl?.origin || appConfig.url,
    protocol: parsedUrl?.protocol || null,
    isLocalhost: parsedUrl ? isLocalHostname(parsedUrl.hostname) : false,
    ready: Boolean(parsedUrl && issues.length === 0),
    issues
  };
}

export function buildPasswordResetUrl(token) {
  const diagnostics = getPasswordResetUrlDiagnostics();

  if (!diagnostics.ready) {
    return null;
  }

  const resetUrl = new URL("/reset-password", diagnostics.baseUrl);
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}
