import { getPasswordResetUrlDiagnostics } from "@/features/auth/password-reset-url";
import { requireSuperAdminContext } from "@/features/admin/server";
import {
  getEmailConfiguration,
  sendTransactionalEmail
} from "@/features/notifications/email-provider";
import { logEmailDeliveryFailure } from "@/features/notifications/email-logging";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { ok } from "@/lib/api/api-response";

export const runtime = "nodejs";

function getDiagnosticReport() {
  const email = getEmailConfiguration();
  const resetUrl = getPasswordResetUrlDiagnostics();
  const warnings = [];

  warnings.push(...email.warnings);
  warnings.push(...resetUrl.issues);

  return {
    email,
    resetUrl,
    warnings
  };
}

export async function GET() {
  try {
    await requireSuperAdminContext();

    return ok(getDiagnosticReport());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  let recipient = null;

  try {
    const { user } = await requireSuperAdminContext();
    const report = getDiagnosticReport();
    recipient = user.email;

    if (!recipient) {
      throw new AppError(
        "The authenticated super admin does not have an email address.",
        422
      );
    }

    if (!report.email.configured) {
      const issues = [
        ...report.email.missingVariables,
        ...report.email.invalidVariables
      ];

      throw new AppError(
        `Email delivery is not configured. Issues: ${issues.join(", ")}.`,
        503
      );
    }

    const result = await sendTransactionalEmail({
      to: recipient,
      subject: "ServiceFlow email delivery diagnostic",
      message:
        "Resend accepted this ServiceFlow diagnostic message. Receiving it confirms the configured sender can deliver to this address.",
      actionUrl: report.resetUrl.ready ? report.resetUrl.baseUrl : null,
      actionLabel: "Open ServiceFlow",
      idempotencyKey: `email-diagnostic:${user.id}:${Date.now()}`
    });

    if (result.skipped) {
      throw new AppError(result.reason, 503);
    }

    return ok({
      message: "Resend accepted the diagnostic email.",
      recipient,
      provider: report.email.provider,
      providerMessageId: result.providerMessageId,
      report
    });
  } catch (error) {
    logEmailDeliveryFailure({
      event: "email_diagnostic_failed",
      recipient,
      error
    });

    return handleApiError(
      error instanceof AppError
        ? error
        : new AppError(
            "The email provider rejected the diagnostic message.",
            502
          )
    );
  }
}
