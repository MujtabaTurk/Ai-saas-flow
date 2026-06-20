import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata = {
  title: "Customer Reset Password | ServiceFlow"
};

export default function CustomerResetPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Secure reset"
      title="Choose a new customer password"
      description="Use the reset link from your email to set a new password."
      footer={
        <Link
          className="font-semibold text-primary hover:underline"
          href="/customer/login"
        >
          Back to customer login
        </Link>
      }
    >
      <ResetPasswordForm loginPath="/customer/login" />
    </AuthLayout>
  );
}
