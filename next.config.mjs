const EMAIL_ADDRESS_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const SMTP_HOST_PATTERN = /^(?!-)(?:[a-z\d-]{1,63}\.)+[a-z\d-]{2,63}$/i;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const TRUE_VALUES = new Set(["1", "true", "yes"]);
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

function validateServiceFlowEnvironment() {
  const isStrictProduction = isStrictProductionEnvironment();
  const failures = [];
  const warnings = [];
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const smtpPortValue = process.env.SMTP_PORT?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(smtpPortValue);
  const smtpFrom = process.env.SMTP_FROM?.trim();
  const senderAddress = getSenderAddress(smtpFrom);
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  const missingStripeVariables = [
    ["STRIPE_SECRET_KEY", stripeSecretKey],
    ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", stripePublishableKey],
    ["STRIPE_WEBHOOK_SECRET", stripeWebhookSecret]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingStripeVariables.length > 0) {
    (isStrictProduction ? failures : warnings).push(
      `Stripe configuration is missing: ${missingStripeVariables.join(", ")}.`
    );
  }

  if (!nextAuthUrl) {
    (isStrictProduction ? failures : warnings).push(
      "NEXTAUTH_URL is required to build password reset links."
    );
  } else {
    try {
      const parsedUrl = new URL(nextAuthUrl);

      if (isStrictProduction && parsedUrl.protocol !== "https:") {
        failures.push("NEXTAUTH_URL must use HTTPS in production.");
      }

      if (isStrictProduction && LOCAL_HOSTNAMES.has(parsedUrl.hostname)) {
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
    (isStrictProduction ? failures : warnings).push(
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

  if (stripeSecretKey && !/^sk_(test|live)_/.test(stripeSecretKey)) {
    failures.push(
      "STRIPE_SECRET_KEY must be a Stripe secret key (sk_test_* or sk_live_*), never a publishable key."
    );
  }

  if (stripePublishableKey && !/^pk_(test|live)_/.test(stripePublishableKey)) {
    failures.push(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a Stripe publishable key (pk_test_* or pk_live_*)."
    );
  }

  const secretMode = stripeSecretKey?.match(/^sk_(test|live)_/)?.[1];
  const publishableMode = stripePublishableKey?.match(/^pk_(test|live)_/)?.[1];
  if (secretMode && publishableMode && secretMode !== publishableMode) {
    failures.push(
      `Stripe keys must use the same mode: STRIPE_SECRET_KEY is ${secretMode} but NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is ${publishableMode}.`
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
