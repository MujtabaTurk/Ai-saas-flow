import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = {
  title: "Register | ServiceFlow"
};

export default function RegisterPage() {
  return (
    <AuthLayout
      eyebrow="Start fresh"
      title="Create your account"
      description="Create an owner account first. Business onboarding comes next."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}

