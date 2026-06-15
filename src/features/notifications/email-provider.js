import { AppError } from "@/lib/api/errors";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function getSenderAddress(from) {
  const value = String(from || "").trim();
  const bracketedAddress = value.match(/<([^>]+)>/)?.[1];

  return (bracketedAddress || value).toLowerCase();
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
  const hasApiKey = Boolean(process.env.RESEND_API_KEY);
  const from = process.env.NOTIFICATION_EMAIL_FROM || null;
  const senderAddress = getSenderAddress(from);

  return {
    configured: Boolean(hasApiKey && from),
    from,
    provider: "resend",
    isTestSender: senderAddress.endsWith("@resend.dev"),
    missingVariables: [
      ...(!hasApiKey ? ["RESEND_API_KEY"] : []),
      ...(!from ? ["NOTIFICATION_EMAIL_FROM"] : [])
    ]
  };
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
      reason:
        "RESEND_API_KEY and NOTIFICATION_EMAIL_FROM are required for email delivery."
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
  const response = await fetch(RESEND_ENDPOINT, {
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
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AppError(
      payload?.message || "Email provider rejected the notification.",
      502
    );
  }

  return {
    skipped: false,
    providerMessageId: payload?.id || null
  };
}
