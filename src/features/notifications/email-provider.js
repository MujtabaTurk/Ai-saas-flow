import { AppError } from "@/lib/api/errors";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_TEST_DOMAIN = "resend.dev";
const EMAIL_ADDRESS_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function getSenderAddress(from) {
  const value = String(from || "").trim();
  const bracketedAddress = value.match(/<([^>]+)>/)?.[1];

  return (bracketedAddress || value).toLowerCase();
}

function getSenderDomain(address) {
  return address.includes("@") ? address.split("@").pop() : null;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getEmailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = process.env.NOTIFICATION_EMAIL_FROM?.trim() || null;
  const senderAddress = getSenderAddress(from);
  const missingVariables = [
    ...(!apiKey ? ["RESEND_API_KEY"] : []),
    ...(!from ? ["NOTIFICATION_EMAIL_FROM"] : [])
  ];
  const invalidVariables = [
    ...(apiKey && !apiKey.startsWith("re_") ? ["RESEND_API_KEY"] : []),
    ...(from && !EMAIL_ADDRESS_PATTERN.test(senderAddress)
      ? ["NOTIFICATION_EMAIL_FROM"]
      : [])
  ];
  const isTestSender = senderAddress.endsWith(`@${RESEND_TEST_DOMAIN}`);
  const warnings = [
    ...(isTestSender
      ? [
          "The resend.dev test sender can deliver only to the Resend account owner's email address. Verify a domain before sending to application users."
        ]
      : [])
  ];

  return {
    configured:
      missingVariables.length === 0 && invalidVariables.length === 0,
    from,
    provider: "resend",
    senderAddress: senderAddress || null,
    senderDomain: getSenderDomain(senderAddress),
    isTestSender,
    missingVariables,
    invalidVariables,
    warnings
  };
}

function buildConfigurationSkipReason(configuration) {
  const missing = configuration.missingVariables.length
    ? ` Missing: ${configuration.missingVariables.join(", ")}.`
    : "";
  const invalid = configuration.invalidVariables.length
    ? ` Invalid: ${configuration.invalidVariables.join(", ")}.`
    : "";

  return `Email delivery is not configured correctly.${missing}${invalid}`.trim();
}

function getProviderErrorPayload(payload, fallbackText) {
  const providerError = payload?.error || payload || {};

  return {
    message:
      providerError.message ||
      payload?.message ||
      fallbackText ||
      "Email provider rejected the notification.",
    name: providerError.name || payload?.name || null,
    code: providerError.code || payload?.code || null
  };
}

async function readProviderPayload(response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return {
      payload: null,
      text: null
    };
  }

  try {
    return {
      payload: JSON.parse(text),
      text
    };
  } catch {
    return {
      payload: null,
      text
    };
  }
}

export async function sendTransactionalEmail({
  to,
  subject,
  message,
  actionUrl = null,
  actionLabel = "Open ServiceFlow",
  idempotencyKey = null
}) {
  const configuration = getEmailConfiguration();

  if (!configuration.configured) {
    return {
      skipped: true,
      reason: buildConfigurationSkipReason(configuration),
      configuration
    };
  }

  if (!to) {
    return {
      skipped: true,
      reason: "A recipient email address is required."
    };
  }

  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
  const actionMarkup = actionUrl
    ? `<p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#10B981;color:#ffffff;text-decoration:none;font-weight:700">${escapeHtml(actionLabel)}</a></p>`
    : "";
  let response;

  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(idempotencyKey
          ? {
              "Idempotency-Key": idempotencyKey
            }
          : {})
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        from: configuration.from,
        to: [to],
        subject,
        text: `${message}${actionUrl ? `\n\n${actionUrl}` : ""}`,
        html: `<div style="font-family:Arial,sans-serif;color:#064E3B;line-height:1.6"><h1 style="font-size:22px">${escapeHtml(subject)}</h1><p>${safeMessage}</p>${actionMarkup}<p style="color:#6B7280;font-size:13px">Sent by ServiceFlow</p></div>`
      })
    });
  } catch (error) {
    throw new AppError(
      error?.name === "TimeoutError"
        ? "Email provider request timed out."
        : "Email provider request failed.",
      502,
      {
        code: "RESEND_REQUEST_FAILED",
        provider: configuration.provider,
        causeName: error?.name || "Error",
        causeMessage: error?.message || "Unknown provider request failure."
      }
    );
  }

  const { payload, text } = await readProviderPayload(response);

  if (!response.ok) {
    const providerError = getProviderErrorPayload(payload, text);

    throw new AppError(
      providerError.message,
      502,
      {
        code: "RESEND_REJECTED_EMAIL",
        provider: configuration.provider,
        providerStatus: response.status,
        providerErrorName: providerError.name,
        providerErrorCode: providerError.code,
        providerResponse: text,
        senderDomain: configuration.senderDomain,
        isTestSender: configuration.isTestSender
      }
    );
  }

  return {
    skipped: false,
    providerMessageId: payload?.id || null
  };
}
