import { appConfig } from "@/config/app";

const TRUE_VALUES = new Set(["1", "true", "yes"]);

function readBooleanEnvironmentValue(name) {
  return TRUE_VALUES.has(String(process.env[name] || "").trim().toLowerCase());
}

function isStrictProductionEnvironment() {
  if (readBooleanEnvironmentValue("SERVICEFLOW_LOCAL_PREVIEW")) {
    return false;
  }

  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.SERVICEFLOW_ENV === "production" ||
    readBooleanEnvironmentValue("SERVICEFLOW_STRICT_ENV")
  );
}

function isLocalHostname(hostname) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

export function getPasswordResetUrlDiagnostics() {
  const configuredUrl = process.env.NEXTAUTH_URL || null;
  const isStrictProduction = isStrictProductionEnvironment();
  const issues = [];
  let parsedUrl = null;

  try {
    parsedUrl = new URL(appConfig.url);
  } catch {
    issues.push("NEXTAUTH_URL must be a valid absolute URL.");
  }

  if (isStrictProduction && !configuredUrl) {
    issues.push("NEXTAUTH_URL is required in production.");
  }

  if (
    isStrictProduction &&
    parsedUrl &&
    parsedUrl.protocol !== "https:"
  ) {
    issues.push("NEXTAUTH_URL must use HTTPS in production.");
  }

  if (
    isStrictProduction &&
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

function isSafeResetPath(path) {
  return ["/reset-password", "/customer/reset-password"].includes(path);
}

export function buildPasswordResetUrl(token, path = "/reset-password") {
  const diagnostics = getPasswordResetUrlDiagnostics();

  if (!diagnostics.ready) {
    return null;
  }

  const resetUrl = new URL(
    isSafeResetPath(path) ? path : "/reset-password",
    diagnostics.baseUrl
  );
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}
