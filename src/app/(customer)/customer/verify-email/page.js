import { AuthLayout } from "@/features/auth/components/auth-layout";
import { EmailVerificationResult } from "@/features/auth/components/email-verification-result";
import { getSafeCallbackUrl } from "@/features/auth/callback-url";

export const metadata = {
  title: "Verify Email | ServiceFlow"
};

export default async function CustomerVerifyEmailPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const token =
    typeof resolvedSearchParams?.token === "string"
      ? resolvedSearchParams.token
      : "";
  const callbackUrl = getSafeCallbackUrl(
    resolvedSearchParams?.callbackUrl,
    "/customer"
  );

  return (
    <AuthLayout
      eyebrow="Email verification"
      title="Verify your email"
      description="We are confirming the email address for your ServiceFlow account."
    >
      <EmailVerificationResult
        callbackUrl={callbackUrl}
        token={token}
      />
    </AuthLayout>
  );
}
