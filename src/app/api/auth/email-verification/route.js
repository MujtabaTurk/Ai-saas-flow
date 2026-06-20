import {
  buildEmailVerificationUrl,
  createStoredEmailVerificationToken
} from "@/features/auth/email-verification";
import { sendEmailVerificationEmail } from "@/features/notifications/events";
import { fail, ok } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        email: true,
        emailVerified: true
      }
    });

    if (!user?.email) {
      return fail("A verified email address is required.", 409);
    }

    if (user.emailVerified) {
      return ok({
        message: "Your email is already verified."
      });
    }

    const { token, tokenHash } = await createStoredEmailVerificationToken(
      user.email
    );
    const verificationUrl = buildEmailVerificationUrl(token);

    if (!verificationUrl) {
      return fail(
        "Email verification links are not configured correctly.",
        503
      );
    }

    try {
      await sendEmailVerificationEmail({
        email: user.email,
        verificationUrl,
        tokenHash
      });
    } catch (error) {
      return fail(
        "We could not send the verification email. Please try again in a few minutes.",
        error?.status || 502,
        process.env.NODE_ENV !== "production"
          ? {
              devVerificationUrl: verificationUrl
            }
          : null
      );
    }

    return ok({
      message: "Verification email sent.",
      ...(process.env.NODE_ENV !== "production"
        ? {
            devVerificationUrl: verificationUrl
          }
        : {})
    });
  } catch (error) {
    return handleApiError(error);
  }
}
