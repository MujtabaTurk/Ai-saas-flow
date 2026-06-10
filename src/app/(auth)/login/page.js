import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";
import { isGoogleProviderEnabled } from "@/features/auth/auth-options";

export const metadata = {
  title: "Login | ServiceFlow"
};

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to ServiceFlow"
      description="Manage your bookings, services, customers, and subscription."
      footer={
        <>
          New to ServiceFlow?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/register">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm googleEnabled={isGoogleProviderEnabled} />
    </AuthLayout>
  );
}
