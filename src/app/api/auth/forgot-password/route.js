import { forgotPasswordSchema } from "@/features/auth/validation/forgot-password-schema";
import { createPasswordResetToken } from "@/features/auth/password";
import { normalizeEmail } from "@/features/auth/normalize-email";
import {
  buildPasswordResetUrl,
  getPasswordResetUrlDiagnostics
} from "@/features/auth/password-reset-url";
import {
  getEmailConfiguration,
  sendTransactionalEmail
} from "@/features/notifications/email-provider";
import { logEmailDeliveryFailure } from "@/features/notifications/email-logging";
import { ok, fail } from "@/lib/api/api-response";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DELIVERY_ERROR_MESSAGE =
  "We could not send the password reset email. Please try again in a few minutes.";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const { data, errors } = await validateRequest(forgotPasswordSchema, payload || {});

  if (errors) {
    return fail("Please enter a valid email address.", 422, errors);
  }

  const email = normalizeEmail(data.email);
  const emailConfiguration = getEmailConfiguration();
  const urlDiagnostics = getPasswordResetUrlDiagnostics();

  if (!emailConfiguration.configured) {
    const configurationError = new Error(
      `Missing email configuration: ${emailConfiguration.missingVariables.join(", ")}.`
    );
    logEmailDeliveryFailure({
      event: "password_reset_configuration_failed",
      recipient: email,
      error: configurationError
    });

    return fail(DELIVERY_ERROR_MESSAGE, 503);
  }

  if (!urlDiagnostics.ready) {
    const urlError = new Error(urlDiagnostics.issues.join(" "));
    logEmailDeliveryFailure({
      event: "password_reset_url_configuration_failed",
      recipient: email,
      error: urlError,
      metadata: {
        baseUrl: urlDiagnostics.baseUrl
      }
    });

    return fail(DELIVERY_ERROR_MESSAGE, 503);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  const response = {
    message: "If an account exists for that email, a password reset email has been sent."
  };

  if (!user) {
    return ok(response);
  }

  const { token, tokenHash } = createPasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const resetUrl = buildPasswordResetUrl(token);

  const resetToken = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      deliveryStatus: "PENDING",
      deliveryAttempts: 0
    }
  });

  const attemptTime = new Date();

  try {
    const result = await sendTransactionalEmail({
      to: email,
      subject: "Reset your ServiceFlow password",
      message:
        "Use the secure link below to reset your password. This link expires in one hour.",
      actionUrl: resetUrl,
      actionLabel: "Reset password",
      idempotencyKey: `password-reset:${tokenHash}`
    });

    if (result.skipped) {
      const skippedError = new Error(result.reason);
      skippedError.deliverySkipped = true;
      throw skippedError;
    }

    try {
      await prisma.passwordResetToken.update({
        where: {
          id: resetToken.id
        },
        data: {
          deliveryStatus: "SENT",
          deliveryAttempts: {
            increment: 1
          },
          lastDeliveryAttemptAt: attemptTime,
          sentAt: attemptTime,
          providerMessageId: result.providerMessageId,
          lastError: null
        }
      });
    } catch (persistenceError) {
      logEmailDeliveryFailure({
        event: "password_reset_delivery_log_failed",
        recipient: email,
        error: persistenceError,
        metadata: {
          resetTokenId: resetToken.id,
          providerMessageId: result.providerMessageId
        }
      });
    }
  } catch (emailError) {
    try {
      await prisma.passwordResetToken.update({
        where: {
          id: resetToken.id
        },
        data: {
          deliveryStatus: emailError.deliverySkipped ? "SKIPPED" : "FAILED",
          deliveryAttempts: {
            increment: 1
          },
          lastDeliveryAttemptAt: attemptTime,
          lastError: emailError?.message || "Email delivery failed.",
          usedAt: process.env.NODE_ENV === "production" ? attemptTime : null
        }
      });
    } catch (persistenceError) {
      logEmailDeliveryFailure({
        event: "password_reset_delivery_log_failed",
        recipient: email,
        error: persistenceError,
        metadata: {
          resetTokenId: resetToken.id
        }
      });
    }

    logEmailDeliveryFailure({
      event: "password_reset_delivery_failed",
      recipient: email,
      error: emailError,
      metadata: {
        resetTokenId: resetToken.id,
        deliveryStatus: emailError.deliverySkipped ? "SKIPPED" : "FAILED"
      }
    });

    return fail(
      DELIVERY_ERROR_MESSAGE,
      emailError.deliverySkipped ? 503 : 502,
      process.env.NODE_ENV !== "production"
        ? {
            devResetUrl: resetUrl
          }
        : null
    );
  }

  if (process.env.NODE_ENV !== "production") {
    response.devResetUrl = resetUrl;
  }

  return ok(response);
}
