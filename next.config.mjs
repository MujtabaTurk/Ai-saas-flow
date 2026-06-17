const EMAIL_ADDRESS_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const SMTP_HOST_PATTERN = /^(?!-)(?:[a-z\d-]{1,63}\.)+[a-z\d-]{2,63}$/i;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const SMTP_ENVIRONMENT_VARIABLES = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM"
];

function getSenderAddress(from) {
  const value = String(from || "").trim();
  const bracketedAddress = value.match(/<([^>]+)>/)?.[1];

  return (bracketedAddress || value).toLowerCase();
}

function isValidSmtpHost(value) {
  if (!value || value.includes("://") || value.includes("/") || value.includes(":")) {
    return false;
  }

  return SMTP_HOST_PATTERN.test(value);
}

function validateServiceFlowEnvironment() {
  const isProduction = process.env.NODE_ENV === "production";
  const failures = [];
  const warnings = [];
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const smtpPortValue = process.env.SMTP_PORT?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(smtpPortValue);
  const smtpFrom = process.env.SMTP_FROM?.trim();
  const senderAddress = getSenderAddress(smtpFrom);

  if (!nextAuthUrl) {
    (isProduction ? failures : warnings).push(
      "NEXTAUTH_URL is required to build password reset links."
    );
  } else {
    try {
      const parsedUrl = new URL(nextAuthUrl);

      if (isProduction && parsedUrl.protocol !== "https:") {
        failures.push("NEXTAUTH_URL must use HTTPS in production.");
      }

      if (isProduction && LOCAL_HOSTNAMES.has(parsedUrl.hostname)) {
        failures.push("NEXTAUTH_URL cannot point to localhost in production.");
      }
    } catch {
      failures.push("NEXTAUTH_URL must be a valid absolute URL.");
    }
  }

  const missingSmtpVariables = SMTP_ENVIRONMENT_VARIABLES.filter(
    (name) => !process.env[name]?.trim()
  );

  if (missingSmtpVariables.length > 0) {
    (isProduction ? failures : warnings).push(
      `SMTP email delivery is missing: ${missingSmtpVariables.join(", ")}.`
    );
  }

  if (
    smtpHost &&
    !isValidSmtpHost(smtpHost)
  ) {
    failures.push(
      "SMTP_HOST must be a hostname such as smtp.gmail.com, not an application URL."
    );
  }

  if (
    smtpPortValue &&
    (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535)
  ) {
    failures.push("SMTP_PORT must be a number between 1 and 65535.");
  }

  if (smtpFrom && !EMAIL_ADDRESS_PATTERN.test(senderAddress)) {
    failures.push(
      "SMTP_FROM must be an email address or a display name with an email address."
    );
  }

  for (const warning of warnings) {
    console.warn(`[env] ${warning}`);
  }

  if (failures.length > 0) {
    throw new Error(
      `Invalid ServiceFlow environment:\n${failures
        .map((failure) => `- ${failure}`)
        .join("\n")}`
    );
  }
}

validateServiceFlowEnvironment();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default nextConfig;
