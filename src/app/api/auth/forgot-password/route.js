import { forgotPasswordSchema } from "@/features/auth/validation/forgot-password-schema";
import { createPasswordResetToken } from "@/features/auth/password";
import { normalizeEmail } from "@/features/auth/normalize-email";
import {
  buildPasswordResetUrl,
  getPasswordResetUrlDiagnostics
} from "@/features/auth/password-reset-url";
import { getEmailConfiguration } from "@/features/notifications/email/config";
import { logEmailDeliveryFailure } from "@/features/notifications/email-logging";
import { sendPasswordResetEmail } from "@/features/notifications/events";
import { ok, fail } from "@/lib/api/api-response";
import { validateRequest } from "@/lib/api/validate-request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DELIVERY_ERROR_MESSAGE =
  "We could not send the password reset email. Please try again in a few minutes.";
const REQUEST_ERROR_MESSAGE =
  "We could not prepare the password reset request. Please try again in a few minutes.";

function buildEmailConfigurationError(configuration) {
  const issues = [
    ...configuration.missingVariables.map((name) => `missing ${name}`),
    ...configuration.invalidVariables.map((name) => `invalid ${name}`)
  ];

  return new Error(
    `Email delivery is not configured correctly: ${issues.join(", ")}.`
  );
}

export async function POST(request) {
  let email = null;
  let resetToken = null;
  let resetUrl = null;
  let stage = "parse_request";

  try {
    const payload = await request.json().catch(() => null);
    stage = "validate_request";
    const { data, errors } = await validateRequest(forgotPasswordSchema, payload || {});

    if (errors) {
      return fail("Please enter a valid email address.", 422, errors);
    }

    email = normalizeEmail(data.email);
    stage = "validate_email_configuration";
    const emailConfiguration = getEmailConfiguration();
    const urlDiagnostics = getPasswordResetUrlDiagnostics();

    if (!emailConfiguration.configured) {
      const configurationError = buildEmailConfigurationError(emailConfiguration);

      logEmailDeliveryFailure({
        event: "password_reset_configuration_failed",
        recipient: email,
        error: configurationError,
        metadata: {
          missingVariables: emailConfiguration.missingVariables,
          invalidVariables: emailConfiguration.invalidVariables,
          warnings: emailConfiguration.warnings
        }
      });

      return fail(DELIVERY_ERROR_MESSAGE, 503);
    }

    stage = "validate_reset_url_configuration";
    if (!urlDiagnostics.ready) {
      const urlError = new Error(urlDiagnostics.issues.join(" "));

      logEmailDeliveryFailure({
        event: "password_reset_url_configuration_failed",
        recipient: email,
        error: urlError,
        metadata: {
          baseUrl: urlDiagnostics.baseUrl,
          issues: urlDiagnostics.issues
        }
      });

      return fail(DELIVERY_ERROR_MESSAGE, 503);
    }

    stage = "lookup_user";
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

    stage = "generate_reset_token";
    const { token, tokenHash } = createPasswordResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    resetUrl = buildPasswordResetUrl(token);

    if (!resetUrl) {
      const resetUrlError = new Error(
        "Password reset URL could not be generated after diagnostics passed."
      );

      logEmailDeliveryFailure({
        event: "password_reset_url_generation_failed",
        recipient: email,
        error: resetUrlError,
        metadata: {
          baseUrl: urlDiagnostics.baseUrl
        }
      });

      return fail(DELIVERY_ERROR_MESSAGE, 503);
    }

    stage = "store_reset_token";
    resetToken = await prisma.passwordResetToken.create({
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
      stage = "send_reset_email";
      const result = await sendPasswordResetEmail({
        email,
        resetUrl,
        tokenHash
      });

      if (result.skipped) {
        const skippedError = new Error(result.reason);
        skippedError.deliverySkipped = true;
        skippedError.details = {
          code: "EMAIL_DELIVERY_SKIPPED",
          configuration: result.configuration || null
        };
        throw skippedError;
      }

      try {
        stage = "persist_delivery_success";
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
            providerMessageId: result.providerMessageId,
            stage
          }
        });
      }
    } catch (emailError) {
      stage = "persist_delivery_failure";
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
            resetTokenId: resetToken.id,
            stage
          }
        });
      }

      logEmailDeliveryFailure({
        event: "password_reset_delivery_failed",
        recipient: email,
        error: emailError,
        metadata: {
          resetTokenId: resetToken.id,
          deliveryStatus: emailError.deliverySkipped ? "SKIPPED" : "FAILED",
          stage: "send_reset_email"
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
  } catch (error) {
    logEmailDeliveryFailure({
      event: "password_reset_request_failed",
      recipient: email,
      error,
      metadata: {
        stage,
        resetTokenId: resetToken?.id || null,
        hasResetUrl: Boolean(resetUrl)
      }
    });

    return fail(REQUEST_ERROR_MESSAGE, 500);
  }
}
