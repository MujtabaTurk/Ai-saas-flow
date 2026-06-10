import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata = {
  title: "Reset Password | ServiceFlow"
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Secure reset"
      title="Choose a new password"
      description="Use the reset link from your email to set a new password."
      footer={
        <Link className="font-semibold text-primary hover:underline" href="/login">
          Back to login
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
