import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata = {
  title: "Forgot Password | ServiceFlow"
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Password help"
      title="Reset your password"
      description="Enter your email and we will prepare a reset link."
      footer={
        <Link className="font-semibold text-primary hover:underline" href="/login">
          Back to login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

