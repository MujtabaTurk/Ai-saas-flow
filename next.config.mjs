const EMAIL_ADDRESS_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function getSenderAddress(from) {
  const value = String(from || "").trim();
  const bracketedAddress = value.match(/<([^>]+)>/)?.[1];

  return (bracketedAddress || value).toLowerCase();
}

function validateServiceFlowEnvironment() {
  const isProduction = process.env.NODE_ENV === "production";
  const failures = [];
  const warnings = [];
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const notificationEmailFrom = process.env.NOTIFICATION_EMAIL_FROM?.trim();
  const senderAddress = getSenderAddress(notificationEmailFrom);

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

  if (!resendApiKey) {
    (isProduction ? failures : warnings).push(
      "RESEND_API_KEY is required for password reset email delivery."
    );
  } else if (!resendApiKey.startsWith("re_")) {
    failures.push("RESEND_API_KEY has an unexpected format.");
  }

  if (!notificationEmailFrom) {
    (isProduction ? failures : warnings).push(
      "NOTIFICATION_EMAIL_FROM is required for password reset email delivery."
    );
  } else if (!EMAIL_ADDRESS_PATTERN.test(senderAddress)) {
    failures.push(
      "NOTIFICATION_EMAIL_FROM must be an email address or a display name with an email address."
    );
  } else if (senderAddress.endsWith("@resend.dev")) {
    const message =
      "NOTIFICATION_EMAIL_FROM uses the resend.dev test sender. It can send only to the Resend account owner address; verify a domain in Resend for application users.";

    (isProduction ? failures : warnings).push(message);
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
