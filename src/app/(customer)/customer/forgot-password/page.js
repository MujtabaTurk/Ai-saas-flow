import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata = {
  title: "Customer Forgot Password | ServiceFlow"
};

export default function CustomerForgotPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Password help"
      title="Reset your customer password"
      description="Enter your email and we will send a customer reset link."
      footer={
        <Link
          className="font-semibold text-primary hover:underline"
          href="/customer/login"
        >
          Back to customer login
        </Link>
      }
    >
      <ForgotPasswordForm resetPath="/customer/reset-password" />
    </AuthLayout>
  );
}
