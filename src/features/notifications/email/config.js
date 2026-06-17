const EMAIL_ADDRESS_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const SMTP_HOST_PATTERN = /^(?!-)(?:[a-z\d-]{1,63}\.)+[a-z\d-]{2,63}$/i;

export const SMTP_ENVIRONMENT_VARIABLES = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM"
];

export function getSenderAddress(from) {
  const value = String(from || "").trim();
  const bracketedAddress = value.match(/<([^>]+)>/)?.[1];

  return (bracketedAddress || value).toLowerCase();
}

function getSenderDomain(address) {
  return address.includes("@") ? address.split("@").pop() : null;
}

function parseSmtpPort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return port;
}

function isValidSmtpHost(value) {
  if (!value || value.includes("://") || value.includes("/") || value.includes(":")) {
    return false;
  }

  return SMTP_HOST_PATTERN.test(value);
}

function getEnvironmentValue(name) {
  return process.env[name]?.trim() || "";
}

export function getEmailConfiguration() {
  const host = getEnvironmentValue("SMTP_HOST");
  const portValue = getEnvironmentValue("SMTP_PORT");
  const user = getEnvironmentValue("SMTP_USER");
  const password = getEnvironmentValue("SMTP_PASSWORD");
  const from = getEnvironmentValue("SMTP_FROM");
  const port = parseSmtpPort(portValue);
  const senderAddress = getSenderAddress(from);
  const missingVariables = SMTP_ENVIRONMENT_VARIABLES.filter(
    (name) => !getEnvironmentValue(name)
  );
  const invalidVariables = [
    ...(host && !isValidSmtpHost(host) ? ["SMTP_HOST"] : []),
    ...(portValue && !port ? ["SMTP_PORT"] : []),
    ...(from && !EMAIL_ADDRESS_PATTERN.test(senderAddress)
      ? ["SMTP_FROM"]
      : [])
  ];
  const warnings = [
    ...(port === 25
      ? [
          "SMTP_PORT 25 is often blocked by cloud providers. Ports 465 or 587 are recommended."
        ]
      : [])
  ];

  return {
    configured:
      missingVariables.length === 0 && invalidVariables.length === 0,
    provider: "nodemailer",
    transport: "smtp",
    host: host || null,
    port,
    secure: port === 465,
    from: from || null,
    senderAddress: senderAddress || null,
    senderDomain: getSenderDomain(senderAddress),
    credentialsConfigured: Boolean(user && password),
    missingVariables,
    invalidVariables,
    warnings
  };
}

export function buildEmailConfigurationError(configuration) {
  const missing = configuration.missingVariables.length
    ? ` Missing: ${configuration.missingVariables.join(", ")}.`
    : "";
  const invalid = configuration.invalidVariables.length
    ? ` Invalid: ${configuration.invalidVariables.join(", ")}.`
    : "";

  return `Email delivery is not configured correctly.${missing}${invalid}`.trim();
}
