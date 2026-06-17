import { createHash } from "crypto";
import nodemailer from "nodemailer";
import {
  buildEmailConfigurationError,
  getEmailConfiguration
} from "@/features/notifications/email/config";
import {
  createTemplatePreview,
  renderEmailTemplate
} from "@/features/notifications/email/templates";
import { AppError } from "@/lib/api/errors";

let cachedTransporter = null;
let cachedTransportKey = null;

function getTransportKey(configuration) {
  return [
    configuration.host,
    configuration.port,
    configuration.secure,
    process.env.SMTP_USER,
    configuration.from
  ].join("|");
}

function getTransporter(configuration) {
  const transportKey = getTransportKey(configuration);

  if (cachedTransporter && cachedTransportKey === transportKey) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  cachedTransportKey = transportKey;

  return cachedTransporter;
}

function buildMessageId(idempotencyKey, senderDomain) {
  if (!idempotencyKey) {
    return undefined;
  }

  const digest = createHash("sha256")
    .update(idempotencyKey)
    .digest("hex")
    .slice(0, 32);
  const domain = senderDomain || "serviceflow.local";

  return `<${digest}@${domain}>`;
}

function normalizeRecipient(to) {
  if (Array.isArray(to)) {
    return to.filter(Boolean);
  }

  return to ? [to] : [];
}

function buildSmtpErrorDetails(error, configuration) {
  return {
    code: "SMTP_SEND_FAILED",
    provider: configuration.provider,
    transport: configuration.transport,
    smtpHost: configuration.host,
    smtpPort: configuration.port,
    smtpSecure: configuration.secure,
    smtpCommand: error?.command || null,
    smtpResponseCode: error?.responseCode || null,
    smtpResponse: error?.response || null,
    causeName: error?.name || "Error"
  };
}

export { getEmailConfiguration };

export function renderTransactionalEmailPreview(templateName) {
  return createTemplatePreview(templateName);
}

export async function sendTransactionalEmail({
  to,
  subject,
  message = "",
  actionUrl = null,
  actionLabel = "Open ServiceFlow",
  idempotencyKey = null,
  template = "generic-notification",
  templateData = {}
}) {
  const configuration = getEmailConfiguration();
  const recipients = normalizeRecipient(to);

  if (!configuration.configured) {
    return {
      skipped: true,
      reason: buildEmailConfigurationError(configuration),
      configuration
    };
  }

  if (recipients.length === 0) {
    return {
      skipped: true,
      reason: "A recipient email address is required.",
      configuration
    };
  }

  const rendered = renderEmailTemplate(template, {
    ...templateData,
    subject,
    message,
    actionUrl,
    actionLabel
  });
  const messageId = buildMessageId(
    idempotencyKey,
    configuration.senderDomain
  );

  try {
    const result = await getTransporter(configuration).sendMail({
      from: configuration.from,
      to: recipients,
      subject: rendered.subject,
      html: rendered.html,
      messageId,
      headers: {
        "X-ServiceFlow-Template": template,
        ...(idempotencyKey
          ? {
              "X-ServiceFlow-Idempotency-Key": idempotencyKey
            }
          : {})
      }
    });
    const acceptedCount = result.accepted?.length || 0;
    const rejectedCount = result.rejected?.length || 0;

    if (acceptedCount === 0 && rejectedCount > 0) {
      throw new AppError("SMTP rejected all recipients.", 502, {
        code: "SMTP_REJECTED_RECIPIENTS",
        provider: configuration.provider,
        rejected: result.rejected
      });
    }

    return {
      skipped: false,
      providerMessageId: result.messageId || messageId || null,
      accepted: result.accepted || [],
      rejected: result.rejected || [],
      response: result.response || null
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error?.message || "SMTP email delivery failed.",
      502,
      buildSmtpErrorDetails(error, configuration)
    );
  }
}
