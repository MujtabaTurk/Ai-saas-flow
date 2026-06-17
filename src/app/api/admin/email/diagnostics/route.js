import { getPasswordResetUrlDiagnostics } from "@/features/auth/password-reset-url";
import { requireSuperAdminContext } from "@/features/admin/server";
import { getEmailConfiguration } from "@/features/notifications/email/config";
import { logEmailDeliveryFailure } from "@/features/notifications/email-logging";
import { sendEmailDiagnostic } from "@/features/notifications/events";
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

    const result = await sendEmailDiagnostic({
      recipient,
      baseUrl: report.resetUrl.ready ? report.resetUrl.baseUrl : null,
      userId: user.id
    });

    if (result.skipped) {
      throw new AppError(result.reason, 503);
    }

    return ok({
      message: "Nodemailer accepted the diagnostic email.",
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
