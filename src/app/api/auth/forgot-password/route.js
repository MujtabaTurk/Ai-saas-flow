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
import { validateJsonRequest } from "@/lib/api/request";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DELIVERY_ERROR_MESSAGE =
  "We could not send the password reset email. Please try again in a few minutes.";
const REQUEST_ERROR_MESSAGE =
  "We could not prepare the password reset request. Please try again in a few minutes.";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const RESET_EMAIL_SENT_MESSAGE =
  "If an account exists for that email, a password reset email has been sent.";

function buildEmailConfigurationError(configuration) {
  const issues = [
    ...configuration.missingVariables.map((name) => `missing ${name}`),
    ...configuration.invalidVariables.map((name) => `invalid ${name}`)
  ];

  return new Error(
    `Email delivery is not configured correctly: ${issues.join(", ")}.`
  );
}

function buildPasswordResetResponse(resetUrl = null) {
  return {
    message: RESET_EMAIL_SENT_MESSAGE,
    ...(process.env.NODE_ENV !== "production" && resetUrl
      ? { devResetUrl: resetUrl }
      : {})
  };
}

function getDevResetUrlDetails(resetUrl) {
  return process.env.NODE_ENV !== "production"
    ? { devResetUrl: resetUrl }
    : null;
}

function logEmailConfigurationFailure(email, emailConfiguration) {
  logEmailDeliveryFailure({
    event: "password_reset_configuration_failed",
    recipient: email,
    error: buildEmailConfigurationError(emailConfiguration),
    metadata: {
      missingVariables: emailConfiguration.missingVariables,
      invalidVariables: emailConfiguration.invalidVariables,
      warnings: emailConfiguration.warnings
    }
  });
}

function logResetUrlConfigurationFailure(email, urlDiagnostics) {
  logEmailDeliveryFailure({
    event: "password_reset_url_configuration_failed",
    recipient: email,
    error: new Error(urlDiagnostics.issues.join(" ")),
    metadata: {
      baseUrl: urlDiagnostics.baseUrl,
      issues: urlDiagnostics.issues
    }
  });
}

function logResetUrlGenerationFailure(email, urlDiagnostics) {
  logEmailDeliveryFailure({
    event: "password_reset_url_generation_failed",
    recipient: email,
    error: new Error(
      "Password reset URL could not be generated after diagnostics passed."
    ),
    metadata: {
      baseUrl: urlDiagnostics.baseUrl
    }
  });
}

function createSkippedDeliveryError(result) {
  const skippedError = new Error(result.reason);

  skippedError.deliverySkipped = true;
  skippedError.details = {
    code: "EMAIL_DELIVERY_SKIPPED",
    configuration: result.configuration || null
  };

  return skippedError;
}

async function findUserForPasswordReset(email) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
}

async function createStoredResetToken(userId, tokenHash) {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      usedAt: null,
      deliveryStatus: "PENDING",
      deliveryAttempts: 0
    }
  });
}

async function persistDeliverySuccess({
  attemptTime,
  email,
  resetToken,
  result,
  stage
}) {
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
        providerMessageId: result.providerMessageId,
        stage
      }
    });
  }
}

async function persistDeliveryFailure({
  attemptTime,
  email,
  emailError,
  resetToken,
  stage
}) {
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
        usedAt: null
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
}

async function sendAndTrackResetEmail({
  email,
  resetToken,
  resetUrl,
  setStage,
  tokenHash
}) {
  const attemptTime = new Date();

  try {
    setStage("send_reset_email");
    const result = await sendPasswordResetEmail({
      email,
      resetUrl,
      tokenHash
    });

    if (result.skipped) {
      throw createSkippedDeliveryError(result);
    }

    const stage = "persist_delivery_success";
    setStage(stage);
    await persistDeliverySuccess({
      attemptTime,
      email,
      resetToken,
      result,
      stage
    });

    return null;
  } catch (emailError) {
    const stage = "persist_delivery_failure";
    setStage(stage);
    await persistDeliveryFailure({
      attemptTime,
      email,
      emailError,
      resetToken,
      stage
    });

    return fail(
      DELIVERY_ERROR_MESSAGE,
      emailError.deliverySkipped ? 503 : 502,
      getDevResetUrlDetails(resetUrl)
    );
  }
}

export async function POST(request) {
  const state = {
    email: null,
    resetToken: null,
    resetUrl: null,
    stage: "parse_request"
  };

  try {
    state.stage = "validate_request";
    const { data, errors } = await validateJsonRequest(
      request,
      forgotPasswordSchema
    );

    if (errors) {
      return fail("Please enter a valid email address.", 422, errors);
    }

    state.email = normalizeEmail(data.email);
    state.stage = "validate_email_configuration";
    const emailConfiguration = getEmailConfiguration();
    const urlDiagnostics = getPasswordResetUrlDiagnostics();

    if (!emailConfiguration.configured) {
      logEmailConfigurationFailure(state.email, emailConfiguration);

      return fail(DELIVERY_ERROR_MESSAGE, 503);
    }

    state.stage = "validate_reset_url_configuration";
    if (!urlDiagnostics.ready) {
      logResetUrlConfigurationFailure(state.email, urlDiagnostics);

      return fail(DELIVERY_ERROR_MESSAGE, 503);
    }

    state.stage = "lookup_user";
    const user = await findUserForPasswordReset(state.email);

    if (!user) {
      return ok(buildPasswordResetResponse());
    }

    state.stage = "generate_reset_token";
    const { token, tokenHash } = createPasswordResetToken();

    state.resetUrl = buildPasswordResetUrl(token, data.resetPath);

    if (!state.resetUrl) {
      logResetUrlGenerationFailure(state.email, urlDiagnostics);

      return fail(DELIVERY_ERROR_MESSAGE, 503);
    }

    state.stage = "store_reset_token";
    state.resetToken = await createStoredResetToken(user.id, tokenHash);

    const deliveryResponse = await sendAndTrackResetEmail({
      email: state.email,
      resetToken: state.resetToken,
      resetUrl: state.resetUrl,
      setStage(nextStage) {
        state.stage = nextStage;
      },
      tokenHash
    });

    if (deliveryResponse) {
      return deliveryResponse;
    }

    return ok(buildPasswordResetResponse(state.resetUrl));
  } catch (error) {
    logEmailDeliveryFailure({
      event: "password_reset_request_failed",
      recipient: state.email,
      error,
      metadata: {
        stage: state.stage,
        resetTokenId: state.resetToken?.id || null,
        hasResetUrl: Boolean(state.resetUrl)
      }
    });

    return fail(REQUEST_ERROR_MESSAGE, 500);
  }
}
