import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";
import { isGoogleProviderEnabled } from "@/features/auth/auth-options";

export const metadata = {
  title: "Customer Registration | ServiceFlow"
};

export default function CustomerRegisterPage() {
  return (
    <AuthLayout
      eyebrow="Customer account"
      title="Create your customer account"
      description="Sign up to manage your bookings, reviews, and customer profile."
      footer={
        <>
          Already have an account?{" "}
          <Link
            className="font-semibold text-primary hover:underline"
            href="/customer/login"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm
        accountType="CUSTOMER"
        defaultCallbackUrl="/customer"
        googleEnabled={isGoogleProviderEnabled}
      />
    </AuthLayout>
  );
}
